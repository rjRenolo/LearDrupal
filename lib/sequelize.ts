import Database from 'better-sqlite3';
import path from 'path';
import { randomUUID } from 'crypto';

const dbPath = path.join(process.cwd(), 'dev.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize promise to track initialization state
let initPromise: Promise<void> | null = null;

// Initialize the database and create tables
export async function initDatabase() {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        // Create tables
        db.exec(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            password TEXT NOT NULL,
            apiKey TEXT,
            role TEXT DEFAULT 'student',
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS progress (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            phase INTEGER NOT NULL,
            week INTEGER NOT NULL,
            day INTEGER NOT NULL,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users(id),
            UNIQUE(userId, phase, week, day)
          );

          CREATE TABLE IF NOT EXISTS phases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            \`order\` INTEGER NOT NULL,
            label TEXT NOT NULL,
            name TEXT NOT NULL,
            color TEXT NOT NULL,
            bg TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS weeks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phaseId INTEGER NOT NULL,
            \`order\` INTEGER NOT NULL,
            label TEXT NOT NULL,
            name TEXT NOT NULL,
            FOREIGN KEY (phaseId) REFERENCES phases(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS days (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            weekId INTEGER NOT NULL,
            \`order\` INTEGER NOT NULL,
            dayLabel TEXT NOT NULL,
            title TEXT NOT NULL,
            goal TEXT NOT NULL,
            activityType TEXT NOT NULL,
            activityTitle TEXT,
            activityIntro TEXT,
            aiPrompt TEXT,
            aiCheckGoal TEXT,
            FOREIGN KEY (weekId) REFERENCES weeks(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS reading_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dayId INTEGER NOT NULL,
            \`order\` INTEGER NOT NULL,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            link TEXT,
            FOREIGN KEY (dayId) REFERENCES days(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS quiz_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dayId INTEGER NOT NULL,
            \`order\` INTEGER NOT NULL,
            q TEXT NOT NULL,
            options TEXT NOT NULL,
            answer INTEGER NOT NULL,
            explanation TEXT NOT NULL,
            FOREIGN KEY (dayId) REFERENCES days(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS hands_on_steps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dayId INTEGER NOT NULL,
            \`order\` INTEGER NOT NULL,
            n INTEGER NOT NULL,
            title TEXT NOT NULL,
            body TEXT,
            code TEXT,
            FOREIGN KEY (dayId) REFERENCES days(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS ai_checks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dayId INTEGER NOT NULL UNIQUE,
            prompt TEXT NOT NULL,
            checkGoal TEXT NOT NULL,
            FOREIGN KEY (dayId) REFERENCES days(id) ON DELETE CASCADE
          );
        `);
        
        console.log('✅ Database initialized successfully');
      } catch (error) {
        console.error('❌ Unable to initialize the database:', error);
        initPromise = null;
        throw error;
      }
    })();
  }
  return initPromise;
}

// Simple model wrapper
function createModel<T extends Record<string, any>>(tableName: string) {
  return {
    findOne: (options: { where?: Record<string, any>; attributes?: string[]; order?: [string, string][] }) => {
      const cols = options.attributes ? options.attributes.join(', ') : '*';
      let sql = `SELECT ${cols} FROM ${tableName}`;
      const values: any[] = [];
      if (options.where) {
        const keys = Object.keys(options.where);
        const where = keys.map(k => `${k === 'order' ? '`order`' : k} = ?`).join(' AND ');
        sql += ` WHERE ${where}`;
        values.push(...keys.map(k => options.where![k]));
      }
      if (options.order) {
        sql += ` ORDER BY ${options.order.map(([col, dir]) => `\`${col}\` ${dir}`).join(', ')}`;
      }
      sql += ` LIMIT 1`;
      const stmt = db.prepare(sql);
      return stmt.get(...values) as T | undefined;
    },
    
    findAll: (options?: { where?: Record<string, any>; attributes?: string[]; order?: [string, string][];  include?: any[] }) => {
      let sql = `SELECT ${options?.attributes ? options.attributes.join(', ') : '*'} FROM ${tableName}`;
      const values: any[] = [];
      
      if (options?.where) {
        const keys = Object.keys(options?.where);
        const where = keys.map(k => `${k === 'order' ? '`order`' : k} = ?`).join(' AND ');
        sql += ` WHERE ${where}`;
        values.push(...keys.map(k => options.where![k]));
      }
      
      if (options?.order) {
        sql += ` ORDER BY ${options.order.map(([col, dir]) => `\`${col}\` ${dir}`).join(', ')}`;
      }
      
      const stmt = db.prepare(sql);
      return stmt.all(...values) as T[];
    },
    
    create: (data: Partial<T>) => {
      const id = data.id || (tableName === 'users' || tableName === 'progress' ? randomUUID() : undefined);
      const fullData = id ? { ...data, id } : data;
      // Filter out timestamp fields - database handles them automatically
      const keys = Object.keys(fullData).filter(k => k !== 'createdAt' && k !== 'updatedAt');
      // Escape reserved keywords
      const escapedKeys = keys.map(k => k === 'order' ? '`order`' : k);
      const placeholders = keys.map(() => '?').join(', ');
      const stmt = db.prepare(`INSERT INTO ${tableName} (${escapedKeys.join(', ')}) VALUES (${placeholders})`);
      const result = stmt.run(...keys.map(k => fullData[k as keyof typeof fullData]));
      const finalId = id || result.lastInsertRowid;
      return { ...fullData, id: finalId } as any as T;
    },
    
    update: (data: Partial<T>, options: { where: Record<string, any> }) => {
      const dataKeys = Object.keys(data);
      // Escape reserved keywords
      const set = dataKeys.map(k => `${k === 'order' ? '`order`' : k} = ?`).join(', ');
      const whereKeys = Object.keys(options.where);
      const where = whereKeys.map(k => `${k === 'order' ? '`order`' : k} = ?`).join(' AND ');
      const stmt = db.prepare(`UPDATE ${tableName} SET ${set} WHERE ${where}`);
      stmt.run(...dataKeys.map(k => data[k as keyof typeof data]), ...whereKeys.map(k => options.where[k]));
      return [1];
    },
    
    destroy: (options: { where: Record<string, any>; truncate?: boolean }) => {
      if (options.truncate) {
        db.prepare(`DELETE FROM ${tableName}`).run();
        return;
      }
      const keys = Object.keys(options.where);
      if (keys.length === 0) {
        db.prepare(`DELETE FROM ${tableName}`).run();
        return;
      }
      const where = keys.map(k => `${k === 'order' ? '`order`' : k} = ?`).join(' AND ');
      const stmt = db.prepare(`DELETE FROM ${tableName} WHERE ${where}`);
      stmt.run(...keys.map(k => options.where[k]));
    },
    
    upsert: (data: Partial<T>) => {
      const keys = Object.keys(data);
      const placeholders = keys.map(() => '?').join(', ');
      const updates = keys.filter(k => k !== 'id').map(k => `${k} = excluded.${k}`).join(', ');
      const stmt = db.prepare(`INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO UPDATE SET ${updates}`);
      stmt.run(...keys.map(k => data[k as keyof typeof data]));
      return [data, true];
    },
    
    count: () => {
      const stmt = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`);
      return (stmt.get() as { count: number }).count;
    },
  };
}

// Export models
export const User = createModel<any>('users');
export const Progress = createModel<any>('progress');
export const Phase = createModel<any>('phases');
export const Week = createModel<any>('weeks');
export const Day = createModel<any>('days');
export const ReadingItem = createModel<any>('reading_items');
export const QuizQuestion = createModel<any>('quiz_questions');
export const HandsOnStep = createModel<any>('hands_on_steps');
export const AiCheck = createModel<any>('ai_checks');

export const sequelize = {
  authenticate: async () => {},
  sync: async () => {},
  transaction: async (callback: (t: any) => Promise<void>) => {
    db.exec('BEGIN');
    try {
      await callback({});
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  },
};

// Auto-initialize on first import
initDatabase();
