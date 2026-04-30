#!/usr/bin/env tsx

/**
 * Initialize the database with Sequelize
 * Usage: npm run db:init
 */

import { initDatabase } from "../lib/sequelize";

async function main() {
  console.log("🔧 Initializing database with Sequelize...\n");
  
  await initDatabase();
  
  console.log("✅ Database initialized successfully!\n");
}

main()
  .catch((error) => {
    console.error("❌ Database initialization failed:");
    console.error(error);
    process.exit(1);
  });
