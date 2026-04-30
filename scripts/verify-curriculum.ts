#!/usr/bin/env tsx

import { Phase, Week, Day, ReadingItem, QuizQuestion, HandsOnStep, AiCheck } from "../lib/db";
import { initDatabase } from "../lib/sequelize";

async function main() {
  await initDatabase();

  console.log("🔍 Verifying seeded curriculum data...\n");

  console.log("📊 Record counts:");
  console.log(`  Phases: ${Phase.count()}`);
  console.log(`  Weeks: ${Week.count()}`);
  console.log(`  Days: ${Day.count()}`);
  console.log(`  Reading Items: ${ReadingItem.count()}`);
  console.log(`  Quiz Questions: ${QuizQuestion.count()}`);
  console.log(`  Hands-On Steps: ${HandsOnStep.count()}`);
  console.log(`  AI Checks: ${AiCheck.count()}\n`);

  const phase0 = Phase.findOne({ where: { order: 0 } });
  if (!phase0) {
    console.error("❌ Phase 0 not found!");
    process.exit(1);
  }

  console.log("✓ Sample query for Phase 0:");
  console.log(`  ${phase0.label}: ${phase0.name}`);
  console.log(`  Color: ${phase0.color}, BG: ${phase0.bg}`);

  const firstWeek = Week.findAll({ where: { phaseId: phase0.id }, order: [['order', 'ASC']] })[0];
  if (firstWeek) {
    console.log(`  First week: ${firstWeek.label} — ${firstWeek.name}`);

    const firstDay = Day.findAll({ where: { weekId: firstWeek.id }, order: [['order', 'ASC']] })[0];
    if (firstDay) {
      const reading = ReadingItem.findAll({ where: { dayId: firstDay.id }, order: [['order', 'ASC']] });
      const questions = QuizQuestion.findAll({ where: { dayId: firstDay.id }, order: [['order', 'ASC']] });
      const steps = HandsOnStep.findAll({ where: { dayId: firstDay.id }, order: [['order', 'ASC']] });

      console.log(`  First day: ${firstDay.dayLabel} — ${firstDay.title}`);
      console.log(`    Activity type: ${firstDay.activityType}`);
      console.log(`    Reading items: ${reading.length}`);
      console.log(`    Quiz questions: ${questions.length}`);
      console.log(`    Hands-on steps: ${steps.length}`);

      if (questions.length > 0) {
        const q = questions[0];
        const options = JSON.parse(q.options);
        console.log(`\n  Quiz question sample:`);
        console.log(`    Q: ${q.q.slice(0, 60)}...`);
        console.log(`    Options count: ${options.length}`);
        console.log(`    Correct answer index: ${q.answer}`);
      }
    }
  }

  console.log("\n✅ Verification complete! Data structure looks good.\n");
}

main().catch(console.error);
