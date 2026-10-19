import { isLimketkaiClient, getClientPaymentTermsDays } from "@/lib/utils/soaColumns";

function runTests() {
  console.log("🧪 Testing Limketkai 30-Day Payment Terms & SOA Logic...\n");

  const testCases: {
    desc: string;
    actual: unknown;
    expected: unknown;
  }[] = [
    // 1. isLimketkaiClient checks
    {
      desc: "isLimketkaiClient('LIMKETKAI') should be true",
      actual: isLimketkaiClient("LIMKETKAI"),
      expected: true,
    },
    {
      desc: "isLimketkaiClient('Limketkai') should be true",
      actual: isLimketkaiClient("Limketkai"),
      expected: true,
    },
    {
      desc: "isLimketkaiClient('limketkai') should be true",
      actual: isLimketkaiClient("limketkai"),
      expected: true,
    },
    {
      desc: "isLimketkaiClient('Limketkai Sons Milling, Inc.') should be true",
      actual: isLimketkaiClient("Limketkai Sons Milling, Inc."),
      expected: true,
    },
    {
      desc: "isLimketkaiClient('  LIMKETKAI  ') should be true",
      actual: isLimketkaiClient("  LIMKETKAI  "),
      expected: true,
    },
    {
      desc: "isLimketkaiClient('IPI') should be false",
      actual: isLimketkaiClient("IPI"),
      expected: false,
    },
    {
      desc: "isLimketkaiClient('Nestle Philippines') should be false",
      actual: isLimketkaiClient("Nestle Philippines"),
      expected: false,
    },
    {
      desc: "isLimketkaiClient('') should be false",
      actual: isLimketkaiClient(""),
      expected: false,
    },
    {
      desc: "isLimketkaiClient(null) should be false",
      actual: isLimketkaiClient(null),
      expected: false,
    },
    {
      desc: "isLimketkaiClient(undefined) should be false",
      actual: isLimketkaiClient(undefined),
      expected: false,
    },

    // 2. getClientPaymentTermsDays checks
    {
      desc: "Limketkai client target should have 30 days terms",
      actual: getClientPaymentTermsDays("LIMKETKAI", "client"),
      expected: 30,
    },
    {
      desc: "Limketkai client with default targetType should have 30 days terms",
      actual: getClientPaymentTermsDays("Limketkai"),
      expected: 30,
    },
    {
      desc: "Limketkai subcon target should have standard 15 days terms",
      actual: getClientPaymentTermsDays("LIMKETKAI", "subcon"),
      expected: 15,
    },
    {
      desc: "Other client (e.g. IPI) should have 15 days terms",
      actual: getClientPaymentTermsDays("IPI", "client"),
      expected: 15,
    },
    {
      desc: "Null client should have 15 days terms",
      actual: getClientPaymentTermsDays(null, "client"),
      expected: 15,
    },

    // 3. String formatted output in SOA
    {
      desc: "SOA Terms string for Limketkai should be 'Terms: 30 days'",
      actual: `Terms: ${getClientPaymentTermsDays("LIMKETKAI")} days`,
      expected: "Terms: 30 days",
    },
    {
      desc: "SOA Terms string for other client should be 'Terms: 15 days'",
      actual: `Terms: ${getClientPaymentTermsDays("Nestle")} days`,
      expected: "Terms: 15 days",
    },

    // 4. Due Date calculation test
    {
      desc: "Due date for Limketkai starting 2026-10-19 should be 2026-11-18 (+30 days)",
      actual: (() => {
        const d = new Date("2026-10-19T00:00:00Z");
        const terms = getClientPaymentTermsDays("LIMKETKAI");
        d.setUTCDate(d.getUTCDate() + terms);
        return d.toISOString().split("T")[0];
      })(),
      expected: "2026-11-18",
    },
    {
      desc: "Due date for IPI starting 2026-10-19 should be 2026-11-03 (+15 days)",
      actual: (() => {
        const d = new Date("2026-10-19T00:00:00Z");
        const terms = getClientPaymentTermsDays("IPI");
        d.setUTCDate(d.getUTCDate() + terms);
        return d.toISOString().split("T")[0];
      })(),
      expected: "2026-11-03",
    },
  ];

  let passed = 0;
  testCases.forEach((tc, idx) => {
    const ok = tc.actual === tc.expected;
    if (ok) passed++;
    console.log(
      `[${ok ? "PASSED" : "FAILED"}] Test #${idx + 1}: ${tc.desc} => Actual: ${tc.actual} (Expected: ${tc.expected})`
    );
  });

  console.log(`\n==========================================`);
  console.log(`📊 Test Summary: ${passed} / ${testCases.length} Tests Passed!`);
  console.log(`==========================================\n`);

  if (passed !== testCases.length) {
    process.exit(1);
  }
}

runTests();
