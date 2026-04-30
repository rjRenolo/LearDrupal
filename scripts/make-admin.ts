#!/usr/bin/env tsx

/**
 * Make a user an admin by email
 * Usage: npm run make-admin -- user@example.com
 */

import { User, Phase, Week, Day, ReadingItem, QuizQuestion, HandsOnStep, AiCheck, db } from "../lib/db";
import { initDatabase } from "../lib/sequelize";

async function main() {
  await initDatabase();
  
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: npm run make-admin -- user@example.com");
    process.exit(1);
  }

  try {
    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    if (user.role === "admin") {
      console.log(`✓ User ${email} is already an admin.`);
      process.exit(0);
    }

    await User.update(
      { role: "admin" },
      { where: { email } }
    );

    console.log(`✓ User ${email} promoted to admin.`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main()
  .catch(console.error);
