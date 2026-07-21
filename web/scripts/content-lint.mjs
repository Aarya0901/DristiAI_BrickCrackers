// Content lint — hard fail on banned vocabulary (brief §5) and on any
// rendered metric number not backed by status "measured" (brief §14.9).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const BANNED = [
  /cheating confirmed/i,
  /\bcaught\b/i,
  /\bguilty\b/i,
  /misconduct detected/i,
  /automated conviction/i,
  /student risk score/i,
  /pupil tracking/i,
  /gaze proof/i,
  /DPDP certified/i,
  /trusted by/i,
];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (["node_modules", ".next", ".git", ".archive"].includes(name)) continue;
      yield* walk(p);
    } else if (/\.(ts|tsx|md|mdx|json)$/.test(name) && !p.includes("content-lint")) {
      yield p;
    }
  }
}

let failures = 0;

for (const file of walk("src")) {
  const text = readFileSync(file, "utf8");
  for (const pattern of BANNED) {
    const m = text.match(pattern);
    if (m) {
      console.error(`BANNED VOCABULARY: ${file}: matched ${pattern} ("${m[0]}")`);
      failures++;
    }
  }
}

// Metric honesty: no unmeasured metric may carry a numeric value.
const metricsSource = readFileSync("src/content/metrics.ts", "utf8");
const blocks = metricsSource.split(/\n  \{/).slice(1);
for (const block of blocks) {
  const status = block.match(/status:\s*"(\w+)"/)?.[1];
  const value = block.match(/value:\s*([^,\n]+)/)?.[1]?.trim();
  if (status && status !== "measured" && value !== "null") {
    console.error(`METRIC HONESTY FAIL: status "${status}" with value ${value}`);
    failures++;
  }
}

if (failures > 0) {
  console.error(`\ncontent-lint: ${failures} failure(s)`);
  process.exit(1);
}
console.log("content-lint: clean (banned vocabulary 0 hits, metric honesty OK)");
