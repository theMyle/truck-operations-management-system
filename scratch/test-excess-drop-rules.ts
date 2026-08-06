import { calculateExcessDropFee } from "@/lib/utils/excessDrop";

function testExcessDropRules() {
  console.log("🧪 Testing Excess Drop Fee Calculations...\n");

  const testCases = [
    { drops: 1, isSubcon: false, custom: null, expected: 0, desc: "1 Drop (Own Fleet)" },
    { drops: 3, isSubcon: false, custom: null, expected: 0, desc: "3 Drops (Own Fleet - Threshold limit)" },
    { drops: 4, isSubcon: false, custom: null, expected: 300, desc: "4 Drops (Own Fleet - 1 excess @ ₱300)" },
    { drops: 5, isSubcon: false, custom: null, expected: 600, desc: "5 Drops (Own Fleet - 2 excess @ ₱300)" },
    { drops: 4, isSubcon: true,  custom: null, expected: 200, desc: "4 Drops (Subcon - 1 excess @ ₱200)" },
    { drops: 5, isSubcon: true,  custom: null, expected: 400, desc: "5 Drops (Subcon - 2 excess @ ₱200)" },
    { drops: 5, isSubcon: false, custom: "500", expected: 500, desc: "5 Drops with Manual Override = ₱500" },
  ];

  let passed = 0;
  testCases.forEach((tc, idx) => {
    const result = calculateExcessDropFee(tc.drops, tc.isSubcon, tc.custom);
    const ok = result === tc.expected;
    if (ok) passed++;
    console.log(
      `[${ok ? "PASSED" : "FAILED"}] Test #${idx + 1}: ${tc.desc} => Result: ₱${result} (Expected: ₱${tc.expected})`
    );
  });

  console.log(`\n==========================================`);
  console.log(`📊 Test Summary: ${passed} / ${testCases.length} Tests Passed!`);
  console.log(`==========================================\n`);

  if (passed !== testCases.length) {
    process.exit(1);
  }
}

testExcessDropRules();
