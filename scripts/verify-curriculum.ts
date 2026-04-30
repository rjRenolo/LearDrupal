#!/usr/bin/env tsx

import { Phase, Week, Day, ReadingItem, QuizQuestion, HandsOnStep, AiCheck } from "../lib/db";
import { initDatabase } from "../lib/sequelize";

async function main() {
  await initDatabase();

  console.log("🔍 Verifying seeded curriculum data...\n");

  const [phases, weeks, days, readingItems, quizQuestions, handsOnSteps, aiChecks] = await Promise.all([
    Phase.count(), Week.count(), Day.count(),
    ReadingItem.count(), QuizQuestion.count(), HandsOnStep.count(), AiCheck.count(),
  ]);

  console.log("📊 Record counts:");
  console.log(`  Phases: ${phases}`);
  console.log(`  Weeks: ${weeks}`);
  console.log(`  Days: ${days}`);
  console.log(`  Reading Items: ${readingItems}`);
  console.log(`  Quiz Questions: ${quizQuestions}`);
  console.log(`  Hands-On Steps: ${handsOnSteps}`);
  console.log(`  AI Checks: ${aiChecks}\n`);

  const phase0 = await Phase.findOne({ where: { order: 0 } });
  if (!phase0) {
    console.error("❌ Phase 0 not found!");
    process.exit(1);
  }

  console.log("✓ Sample query for Phase 0:");
  console.log(`  ${phase0.label}: ${phase0.name}`);
  console.log(`  Color: ${phase0.color}, BG: ${phase0.bg}`);

  const allWeeks = await Week.findAll({ where: { phaseId: phase0.id }, order: [['order', 'ASC']] });
  const firstWeek = allWeeks[0];
  if (firstWeek) {
    console.log(`  First week: ${firstWeek.label} — ${firstWeek.name}`);

    const allDays = await Day.findAll({ where: { weekId: firstWeek.id }, order: [['order', 'ASC']] });
    const firstDay = allDays[0];
    if (firstDay) {
      const [reading, questions, steps] = await Promise.all([
        ReadingItem.findAll({ where: { dayId: firstDay.id }, order: [['order', 'ASC']] }),
        QuizQuestion.findAll({ where: { dayId: firstDay.id }, order: [['order', 'ASC']] }),
        HandsOnStep.findAll({ where: { dayId: firstDay.id }, order: [['order', 'ASC']] }),
      ]);

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
