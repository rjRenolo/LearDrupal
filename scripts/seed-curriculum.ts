#!/usr/bin/env tsx

/**
 * Seed the database with curriculum from TypeScript files
 * Usage: npm run db:seed
 */

import { User, Phase, Week, Day, ReadingItem, QuizQuestion, HandsOnStep, AiCheck, db } from "../lib/db";
import { initDatabase } from "../lib/sequelize";
import { PHASES } from "../lib/curriculum-data";

async function main() {
  await initDatabase();
  
  console.log("🌱 Seeding curriculum...\n");

  // Wipe existing curriculum data (safe — Progress uses phase/week/day integers, not FKs)
  console.log("🗑️  Clearing existing curriculum data...");
  await AiCheck.destroy({ where: {}, truncate: true });
  await HandsOnStep.destroy({ where: {}, truncate: true });
  await QuizQuestion.destroy({ where: {}, truncate: true });
  await ReadingItem.destroy({ where: {}, truncate: true });
  await Day.destroy({ where: {}, truncate: true });
  await Week.destroy({ where: {}, truncate: true });
  await Phase.destroy({ where: {}, truncate: true });
  console.log("✓ Cleared\n");

  let totalDays = 0;

  for (let pi = 0; pi < PHASES.length; pi++) {
    const phaseData = PHASES[pi];
    console.log(`📘 Phase ${pi}: ${phaseData.label} — ${phaseData.name}`);

    const phase = await Phase.create({
      order: pi,
      label: phaseData.label,
      name: phaseData.name,
      color: phaseData.color,
      bg: phaseData.bg,
    });

    for (let wi = 0; wi < phaseData.weeks.length; wi++) {
      const weekData = phaseData.weeks[wi];
      console.log(`  📗 Week ${wi}: ${weekData.label} — ${weekData.name}`);

      const week = await Week.create({
        phaseId: phase.id,
        order: wi,
        label: weekData.label,
        name: weekData.name,
      });

      for (let di = 0; di < weekData.days.length; di++) {
        const dayData = weekData.days[di];
        const act = dayData.activity;

        const day = await Day.create({
          weekId: week.id,
          order: di,
          dayLabel: dayData.day,
          title: dayData.title,
          goal: dayData.goal,
          activityType: act.type,
          activityTitle: act.title ?? null,
          activityIntro: act.intro ?? null,
          aiPrompt: act.type === "ai_open" ? (act.prompt ?? null) : null,
          aiCheckGoal: act.type === "ai_open" ? (act.checkGoal ?? null) : null,
        });

        // Reading items
        for (let ri = 0; ri < dayData.reading.length; ri++) {
          const r = dayData.reading[ri];
          await ReadingItem.create({
            dayId: day.id,
            order: ri,
            title: r.title,
            body: r.body,
            link: r.link ?? null,
          });
        }

        // Quiz questions (quiz + combined)
        if (act.questions) {
          for (let qi = 0; qi < act.questions.length; qi++) {
            const q = act.questions[qi];
            await QuizQuestion.create({
              dayId: day.id,
              order: qi,
              q: q.q,
              options: JSON.stringify(q.options),
              answer: q.answer,
              explanation: q.explanation,
            });
          }
        }

        // Hands-on steps (hands_on + combined)
        if (act.steps) {
          for (let si = 0; si < act.steps.length; si++) {
            const s = act.steps[si];
            await HandsOnStep.create({
              dayId: day.id,
              order: si,
              n: s.n,
              title: s.title,
              body: s.body ?? null,
              code: s.code ?? null,
            });
          }
        }

        // AiCheck (hands_on + combined)
        if (act.aiCheck) {
          await AiCheck.create({
            dayId: day.id,
            prompt: act.aiCheck.prompt,
            checkGoal: act.aiCheck.checkGoal,
          });
        }

        totalDays++;
        console.log(`    ✓ ${dayData.day}: ${dayData.title} (${act.type})`);
      }
    }
    console.log();
  }

  console.log(`✅ Seeding complete! Imported ${PHASES.length} phases, ${totalDays} days.\n`);
}

main()
  .catch((error) => {
    console.error("❌ Seeding failed:");
    console.error(error);
    process.exit(1);
  });
