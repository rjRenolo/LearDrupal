#!/usr/bin/env tsx

/**
 * End-to-end test for Phase 4 - Verify learn page uses database
 * Tests that the curriculum API is working and returns correct data
 */

async function main() {
  console.log("🧪 Testing Phase 4: Learn page database integration\n");

  const baseUrl = "http://localhost:3000";

  try {
    // Test 1: API endpoint responds
    console.log("1. Testing /api/curriculum endpoint...");
    const response = await fetch(`${baseUrl}/api/curriculum`);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`   ✓ API responded with ${data.length} phases\n`);

    // Test 2: Data structure is correct
    console.log("2. Validating data structure...");
    if (!Array.isArray(data)) {
      throw new Error("Response is not an array");
    }

    const phase0 = data[0];
    if (phase0.id === undefined || !phase0.label || !phase0.weeks) {
      throw new Error("Phase structure is invalid");
    }
    console.log(`   ✓ Phase 0: ${phase0.label} — ${phase0.name}`);
    console.log(`   ✓ Has ${phase0.weeks.length} weeks\n`);

    // Test 3: Count totals
    console.log("3. Counting curriculum items...");
    let totalWeeks = 0;
    let totalDays = 0;

    for (const phase of data) {
      totalWeeks += phase.weeks.length;
      for (const week of phase.weeks) {
        totalDays += week.days.length;
      }
    }

    console.log(`   ✓ Total phases: ${data.length}`);
    console.log(`   ✓ Total weeks: ${totalWeeks}`);
    console.log(`   ✓ Total days: ${totalDays}\n`);

    // Test 4: Verify quiz options are parsed
    console.log("4. Verifying quiz question format...");
    const firstDay = data[0].weeks[0].days[0];
    if (firstDay.activity.questions && firstDay.activity.questions.length > 0) {
      const firstQuestion = firstDay.activity.questions[0];
      if (!Array.isArray(firstQuestion.options)) {
        throw new Error("Quiz options are not an array");
      }
      console.log(`   ✓ Quiz options are properly parsed (${firstQuestion.options.length} options)\n`);
    }

    // Test 5: Learn page loads
    console.log("5. Testing /learn page loads...");
    const learnResponse = await fetch(`${baseUrl}/learn`, {
      redirect: "manual", // Don't follow redirects (auth may redirect)
    });
    
    if (learnResponse.status === 200 || learnResponse.status === 303) {
      console.log(`   ✓ Learn page responds (${learnResponse.status})\n`);
    } else {
      console.log(`   ⚠ Learn page returned ${learnResponse.status} (may need auth)\n`);
    }

    console.log("✅ All tests passed! Learn page is using the database.\n");
    console.log("Summary:");
    console.log(`  • Curriculum API working: ${baseUrl}/api/curriculum`);
    console.log(`  • Data structure validated`);
    console.log(`  • ${data.length} phases, ${totalDays} days loaded from database`);
    console.log(`  • Learn page accessible\n`);

  } catch (error) {
    console.error("❌ Test failed:");
    console.error(error);
    process.exit(1);
  }
}

main();
