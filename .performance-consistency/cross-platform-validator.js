#!/usr/bin/env node
// cross-platform-validator.js

import { platform } from 'os';
import { runBenchmarks } from './performance-monitor.js';

const PLATFORM_TARGETS = {
  darwin: { version: 60, help: 80 },
  win32: { version: 80, help: 100 },
  linux: { version: 60, help: 80 }
};

async function validateCrossPlatformPerformance() {
  const currentPlatform = platform();
  const targets = PLATFORM_TARGETS[currentPlatform];

  if (!targets) {
    console.warn(`⚠️ No performance targets defined for platform: ${currentPlatform}`);
    return;
  }

  console.log(`🔍 Validating performance on ${currentPlatform}`);

  const results = await runBenchmarks();

  let allPassed = true;

  for (const [command, result] of Object.entries(results)) {
    const target = targets[command];
    if (target && result.median > target) {
      console.error(`❌ ${command}: ${result.median}ms > ${target}ms target`);
      allPassed = false;
    } else {
      console.log(`✅ ${command}: ${result.median}ms ≤ ${target}ms target`);
    }
  }

  if (!allPassed) {
    process.exit(1);
  }
}

validateCrossPlatformPerformance().catch(console.error);