#!/usr/bin/env node
/**
 * Guard script: verifies each REQ ID in requirements/requirements.lock.md
 * appears in at least one test title/file (simple grep-based check).
 *
 * Usage: node scripts/guard-reqs.js
 * Exit code: 0 = ok, 1 = missing coverage or errors.
 */
const fs = require('fs');
const path = require('path');

const LOCK_PATH = path.join(process.cwd(), 'requirements', 'requirements.lock.md');
const SEARCH_DIRS = ['tests', 'src']; // add more if needed
const TEST_NAME_HINTS = ['.test.', '.spec.'];

function readFileSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
}

function listFiles(dir) {
  let results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        results = results.concat(listFiles(full));
      } else {
        results.push(full);
      }
    }
  } catch {}
  return results;
}

function isLikelyTestFile(file) {
  return TEST_NAME_HINTS.some(h => file.includes(h));
}

function extractReqIds(markdown) {
  const ids = new Set();
  const re = /\\bREQ-[A-Z0-9-]+\\b/g; // supports REQ-123 or domainy REQ-FOO-1
  let m;
  while ((m = re.exec(markdown)) !== null) {
    ids.add(m[0]);
  }
  return Array.from(ids);
}

function main() {
  const lock = readFileSafe(LOCK_PATH);
  if (!lock) {
    console.error(`[guard:reqs] Missing ${LOCK_PATH}. Create it via QNEW/QPLAN before coding.`);
    process.exit(1);
  }

  const reqIds = extractReqIds(lock);
  if (!reqIds.length) {
    console.error(`[guard:reqs] No REQ IDs found in ${LOCK_PATH}. Add headings like "## REQ-123: ..."`);
    process.exit(1);
  }

  // Gather test contents
  const files = SEARCH_DIRS.flatMap(d => listFiles(path.join(process.cwd(), d)));
  const testFiles = files.filter(isLikelyTestFile);
  const blobs = testFiles.map(f => readFileSafe(f) || '').join('\\n');

  const missing = reqIds.filter(id => !blobs.includes(id));
  if (missing.length) {
    console.error(`[guard:reqs] Missing test references for REQ IDs: ${missing.join(', ')}`);
    console.error(`  Ensure at least one test title contains each REQ ID (e.g., "REQ-123 — does X")`);
    process.exit(1);
  }

  console.log(`[guard:reqs] OK: All REQ IDs present in test files.`);
  process.exit(0);
}

main();
