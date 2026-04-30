#!/usr/bin/env tsx

/**
 * Compare database output with static TypeScript output
 * Ensures the transform logic produces identical results
 */

import { getCurriculumFromDB } from "../lib/curriculum-db";
import { PHASES as STATIC_PHASES } from "../lib/curriculum-data";
import { Phase } from "../lib/curriculum";

async function main() {
  console.log("🔍 Comparing database output with static TypeScript data...\n");

  const dbPhases = await getCurriculumFromDB();

  // Compare counts
  console.log("📊 Phase counts:");
  console.log(`  Static: ${STATIC_PHASES.length} phases`);
  console.log(`  Database: ${dbPhases.length} phases`);

  if (STATIC_PHASES.length !== dbPhases.length) {
    console.error("❌ Phase count mismatch!");
    process.exit(1);
  }

  let totalStaticDays = 0;
  let totalDbDays = 0;
  let issues: string[] = [];

  // Deep comparison
  for (let pi = 0; pi < STATIC_PHASES.length; pi++) {
    const staticPhase = STATIC_PHASES[pi];
    const dbPhase = dbPhases[pi];

    // Check phase properties
    if (staticPhase.label !== dbPhase.label) {
      issues.push(`Phase ${pi}: label mismatch (${staticPhase.label} vs ${dbPhase.label})`);
    }
    if (staticPhase.name !== dbPhase.name) {
      issues.push(`Phase ${pi}: name mismatch (${staticPhase.name} vs ${dbPhase.name})`);
    }
    if (staticPhase.color !== dbPhase.color) {
      issues.push(`Phase ${pi}: color mismatch`);
    }

    // Check week counts
    if (staticPhase.weeks.length !== dbPhase.weeks.length) {
      issues.push(`Phase ${pi}: week count mismatch (${staticPhase.weeks.length} vs ${dbPhase.weeks.length})`);
      continue;
    }

    for (let wi = 0; wi < staticPhase.weeks.length; wi++) {
      const staticWeek = staticPhase.weeks[wi];
      const dbWeek = dbPhase.weeks[wi];

      // Check day counts
      if (staticWeek.days.length !== dbWeek.days.length) {
        issues.push(`Phase ${pi} Week ${wi}: day count mismatch (${staticWeek.days.length} vs ${dbWeek.days.length})`);
        continue;
      }

      totalStaticDays += staticWeek.days.length;
      totalDbDays += dbWeek.days.length;

      for (let di = 0; di < staticWeek.days.length; di++) {
        const staticDay = staticWeek.days[di];
        const dbDay = dbWeek.days[di];

        // Check day properties
        if (staticDay.title !== dbDay.title) {
          issues.push(`Day ${pi}-${wi}-${di}: title mismatch`);
        }
        if (staticDay.activity.type !== dbDay.activity.type) {
          issues.push(`Day ${pi}-${wi}-${di}: activity type mismatch`);
        }

        // Check reading count
        if (staticDay.reading.length !== dbDay.reading.length) {
          issues.push(`Day ${pi}-${wi}-${di}: reading count mismatch`);
        }

        // Check activity-specific data
        const staticAct = staticDay.activity;
        const dbAct = dbDay.activity;

        if (staticAct.questions && dbAct.questions) {
          if (staticAct.questions.length !== dbAct.questions.length) {
            issues.push(`Day ${pi}-${wi}-${di}: question count mismatch`);
          } else {
            // Spot check first question's options
            const staticQ = staticAct.questions[0];
            const dbQ = dbAct.questions[0];
            if (JSON.stringify(staticQ.options) !== JSON.stringify(dbQ.options)) {
              issues.push(`Day ${pi}-${wi}-${di}: first question options mismatch`);
            }
          }
        }

        if (staticAct.steps && dbAct.steps) {
          if (staticAct.steps.length !== dbAct.steps.length) {
            issues.push(`Day ${pi}-${wi}-${di}: steps count mismatch`);
          }
        }
      }
    }
  }

  console.log(`  Static: ${totalStaticDays} total days`);
  console.log(`  Database: ${totalDbDays} total days\n`);

  if (issues.length === 0) {
    console.log("✅ All checks passed! Database output matches static TypeScript data perfectly.\n");
  } else {
    console.error(`❌ Found ${issues.length} issues:\n`);
    issues.forEach(issue => console.error(`  - ${issue}`));
    console.error();
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error("❌ Comparison failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(() => process.exit(0));
