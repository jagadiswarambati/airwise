import { execSync } from 'child_process';

const timezones = ['UTC', 'Asia/Kolkata', 'America/Los_Angeles'];
const targetTest = process.argv[2] || 'tests/unit/timezone-slots.test.ts';

console.log(`Running Vitest across target timezones to verify timezone invariance (${targetTest}):`);

for (const tz of timezones) {
  console.log(`\n========================================`);
  console.log(`Testing with TZ=${tz}`);
  console.log(`========================================`);
  try {
    execSync(`npx vitest run ${targetTest}`, {
      stdio: 'inherit',
      env: {
        ...process.env,
        TZ: tz,
      },
    });
  } catch (_error) {
    console.error(`ERROR: Tests failed under TZ=${tz}`);
    process.exit(1);
  }
}

console.log('\nPASS: All timezone invariance tests passed across UTC, Asia/Kolkata, and America/Los_Angeles.');
process.exit(0);
