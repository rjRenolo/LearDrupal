import { Pool, PoolConfig } from 'pg';
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
};

// Opt-in SSL: set DATABASE_SSL=true for managed databases (Heroku, Render, Supabase, etc.)
if (process.env.DATABASE_SSL === 'true') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

type DbClient = { query: (text: string, values?: any[]) => Promise<{ rows: any[] }> };
const txStorage = new AsyncLocalStorage<DbClient>();

function getDb(): DbClient {
  return txStorage.getStore() ?? pool;
}

// Double-quote camelCase identifiers and reserved words for PostgreSQL
function q(col: string): string {
  if (/[A-Z]/.test(col) || col === 'order') return `"${col}"`;
  return col;
}

let initPromise: Promise<void> | null = null;

export async function initDatabase(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            password TEXT NOT NULL,
            "apiKey" TEXT,
            role TEXT DEFAULT 'student',
            "createdAt" TIMESTAMPTZ DEFAULT NOW(),
            "updatedAt" TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS progress (
            id TEXT PRIMARY KEY,
            "userId" TEXT NOT NULL REFERENCES users(id),
            phase INTEGER NOT NULL,
            week INTEGER NOT NULL,
            day INTEGER NOT NULL,
            "createdAt" TIMESTAMPTZ DEFAULT NOW(),
            "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE("userId", phase, week, day)
          );

          CREATE TABLE IF NOT EXISTS phases (
            id SERIAL PRIMARY KEY,
            "order" INTEGER NOT NULL,
            label TEXT NOT NULL,
            name TEXT NOT NULL,
            color TEXT NOT NULL,
            bg TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS weeks (
            id SERIAL PRIMARY KEY,
            "phaseId" INTEGER NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
            "order" INTEGER NOT NULL,
            label TEXT NOT NULL,
            name TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS days (
            id SERIAL PRIMARY KEY,
            "weekId" INTEGER NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
            "order" INTEGER NOT NULL,
            "dayLabel" TEXT NOT NULL,
            title TEXT NOT NULL,
            goal TEXT NOT NULL,
            "activityType" TEXT NOT NULL,
            "activityTitle" TEXT,
            "activityIntro" TEXT,
            "aiPrompt" TEXT,
            "aiCheckGoal" TEXT
          );

          CREATE TABLE IF NOT EXISTS reading_items (
            id SERIAL PRIMARY KEY,
            "dayId" INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
            "order" INTEGER NOT NULL,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            link TEXT
          );

          CREATE TABLE IF NOT EXISTS quiz_questions (
            id SERIAL PRIMARY KEY,
            "dayId" INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
            "order" INTEGER NOT NULL,
            q TEXT NOT NULL,
            options TEXT NOT NULL,
            answer INTEGER NOT NULL,
            explanation TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS hands_on_steps (
            id SERIAL PRIMARY KEY,
            "dayId" INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
            "order" INTEGER NOT NULL,
            n INTEGER NOT NULL,
            title TEXT NOT NULL,
            body TEXT,
            code TEXT
          );

          CREATE TABLE IF NOT EXISTS ai_checks (
            id SERIAL PRIMARY KEY,
            "dayId" INTEGER NOT NULL UNIQUE REFERENCES days(id) ON DELETE CASCADE,
            prompt TEXT NOT NULL,
            "checkGoal" TEXT NOT NULL
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

function createModel<T extends Record<string, any>>(tableName: string, conflictKeys?: string[]) {
  return {
    findOne: async (options: { where?: Record<string, any>; attributes?: string[]; order?: [string, string][] }): Promise<T | undefined> => {
      const cols = options.attributes ? options.attributes.map(q).join(', ') : '*';
      let sql = `SELECT ${cols} FROM ${tableName}`;
      const values: any[] = [];
      if (options.where) {
        const keys = Object.keys(options.where);
        if (keys.length > 0) {
          sql += ` WHERE ${keys.map((k, i) => `${q(k)} = $${i + 1}`).join(' AND ')}`;
          values.push(...keys.map(k => options.where![k]));
        }
      }
      if (options.order) {
        sql += ` ORDER BY ${options.order.map(([col, dir]) => `${q(col)} ${dir}`).join(', ')}`;
      }
      sql += ` LIMIT 1`;
      const result = await getDb().query(sql, values);
      return result.rows[0] as T | undefined;
    },

    findAll: async (options?: { where?: Record<string, any>; attributes?: string[]; order?: [string, string][] }): Promise<T[]> => {
      const cols = options?.attributes ? options.attributes.map(q).join(', ') : '*';
      let sql = `SELECT ${cols} FROM ${tableName}`;
      const values: any[] = [];
      if (options?.where) {
        const keys = Object.keys(options.where);
        if (keys.length > 0) {
          sql += ` WHERE ${keys.map((k, i) => `${q(k)} = $${i + 1}`).join(' AND ')}`;
          values.push(...keys.map(k => options.where![k]));
        }
      }
      if (options?.order) {
        sql += ` ORDER BY ${options.order.map(([col, dir]) => `${q(col)} ${dir}`).join(', ')}`;
      }
      const result = await getDb().query(sql, values);
      return result.rows as T[];
    },

    create: async (data: Partial<T>): Promise<T> => {
      const id = (data as any).id || (tableName === 'users' || tableName === 'progress' ? randomUUID() : undefined);
      const fullData = id ? { ...data, id } : { ...data };
      const keys = Object.keys(fullData).filter(k => k !== 'createdAt' && k !== 'updatedAt');
      const cols = keys.map(q).join(', ');
      const vals = keys.map((_, i) => `$${i + 1}`).join(', ');
      const result = await getDb().query(
        `INSERT INTO ${tableName} (${cols}) VALUES (${vals}) RETURNING *`,
        keys.map(k => fullData[k])
      );
      return result.rows[0] as T;
    },

    update: async (data: Partial<T>, options: { where: Record<string, any> }): Promise<[number]> => {
      const dataKeys = Object.keys(data);
      const set = dataKeys.map((k, i) => `${q(k)} = $${i + 1}`).join(', ');
      const whereKeys = Object.keys(options.where);
      const where = whereKeys.map((k, i) => `${q(k)} = $${dataKeys.length + i + 1}`).join(' AND ');
      await getDb().query(
        `UPDATE ${tableName} SET ${set} WHERE ${where}`,
        [...dataKeys.map(k => data[k as keyof typeof data]), ...whereKeys.map(k => options.where[k])]
      );
      return [1];
    },

    destroy: async (options: { where?: Record<string, any>; truncate?: boolean }): Promise<void> => {
      if (options.truncate) {
        await getDb().query(`TRUNCATE ${tableName} RESTART IDENTITY CASCADE`);
        return;
      }
      const keys = Object.keys(options.where ?? {});
      if (keys.length === 0) {
        await getDb().query(`DELETE FROM ${tableName}`);
        return;
      }
      const where = keys.map((k, i) => `${q(k)} = $${i + 1}`).join(' AND ');
      await getDb().query(
        `DELETE FROM ${tableName} WHERE ${where}`,
        keys.map(k => (options.where ?? {})[k])
      );
    },

    upsert: async (data: Partial<T>): Promise<[Partial<T>, boolean]> => {
      const id = (data as any).id || (tableName === 'users' || tableName === 'progress' ? randomUUID() : undefined);
      const fullData = id ? { ...data, id } : { ...data };
      const keys = Object.keys(fullData);
      const cols = keys.map(q).join(', ');
      const vals = keys.map((_, i) => `$${i + 1}`).join(', ');
      const targets = (conflictKeys ?? ['id']).map(q).join(', ');
      const updateCols = keys.filter(k => !(conflictKeys ?? ['id']).includes(k) && k !== 'id');
      const updates = updateCols.map(k => `${q(k)} = EXCLUDED.${q(k)}`).join(', ');
      const sql = updates.length > 0
        ? `INSERT INTO ${tableName} (${cols}) VALUES (${vals}) ON CONFLICT (${targets}) DO UPDATE SET ${updates}`
        : `INSERT INTO ${tableName} (${cols}) VALUES (${vals}) ON CONFLICT (${targets}) DO NOTHING`;
      await getDb().query(sql, keys.map(k => fullData[k]));
      return [fullData, true];
    },

    count: async (): Promise<number> => {
      const result = await getDb().query(`SELECT COUNT(*)::int AS count FROM ${tableName}`);
      return result.rows[0].count;
    },
  };
}

export const User = createModel<any>('users');
export const Progress = createModel<any>('progress', ['userId', 'phase', 'week', 'day']);
export const Phase = createModel<any>('phases');
export const Week = createModel<any>('weeks');
export const Day = createModel<any>('days');
export const ReadingItem = createModel<any>('reading_items');
export const QuizQuestion = createModel<any>('quiz_questions');
export const HandsOnStep = createModel<any>('hands_on_steps');
export const AiCheck = createModel<any>('ai_checks');

export const sequelize = {
  authenticate: async () => { await pool.query('SELECT 1'); },
  sync: async () => {},
  // Uses AsyncLocalStorage so all model calls inside callback share the same PG client
  transaction: async (callback: () => Promise<void>): Promise<void> => {
    const client = await pool.connect();
    await client.query('BEGIN');
    try {
      await txStorage.run(client as any, callback);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

// Auto-initialize on first import
initDatabase();
