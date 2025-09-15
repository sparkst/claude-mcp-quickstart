#!/usr/bin/env node

/**
 * Test to simulate pre-optimization CLI performance
 * This loads all dependencies upfront to measure the impact of lazy loading
 */

import { createRequire } from "module";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Simulate pre-optimization by eagerly loading all dependencies
async function measureUnoptimizedStartup() {
  return new Promise((resolve, reject) => {
    const startTime = process.hrtime.bigint();

    // Create a temporary file that loads everything upfront (simulating pre-optimization)
    const testScript = `
      import { createRequire } from "module";
      const require = createRequire(import.meta.url);
      const packageJson = require("./package.json");

      // Load all dependencies upfront (pre-optimization behavior)
      import("commander").then(() => import("chalk")).then(() => import("fs/promises")).then(() => import("inquirer")).then(() => import("ora")).then(() => {
        // Simulate version command after loading everything
        console.log(packageJson.version);
        process.exit(0);
      });
    `;

    const child = spawn("node", ["--input-type=module", "-e", testScript], {
      stdio: "pipe",
      cwd: __dirname
    });

    child.on("close", (code) => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      if (code === 0) {
        resolve(duration);
      } else {
        reject(new Error(`Test failed with code ${code}`));
      }
    });

    child.on("error", reject);
  });
}

// Measure current optimized performance for comparison
async function measureOptimizedStartup() {
  return new Promise((resolve, reject) => {
    const startTime = process.hrtime.bigint();

    const child = spawn("node", [path.join(__dirname, "index.js"), "--version"], {
      stdio: "pipe"
    });

    child.on("close", (code) => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      if (code === 0) {
        resolve(duration);
      } else {
        reject(new Error(`Test failed with code ${code}`));
      }
    });

    child.on("error", reject);
  });
}

async function runPerformanceComparison() {
  console.log("🔬 Performance Optimization Impact Analysis\n");

  const iterations = 5;
  const unoptimizedTimes = [];
  const optimizedTimes = [];

  console.log("📊 Measuring pre-optimization performance (simulated)...");
  for (let i = 0; i < iterations; i++) {
    try {
      const time = await measureUnoptimizedStartup();
      unoptimizedTimes.push(time);
      process.stdout.write(".");
    } catch (error) {
      console.error(`\nError in unoptimized test ${i + 1}:`, error.message);
    }
  }

  console.log("\n📊 Measuring current optimized performance...");
  for (let i = 0; i < iterations; i++) {
    const time = await measureOptimizedStartup();
    optimizedTimes.push(time);
    process.stdout.write(".");
  }

  // Calculate statistics
  const avgUnoptimized = unoptimizedTimes.reduce((a, b) => a + b, 0) / unoptimizedTimes.length;
  const avgOptimized = optimizedTimes.reduce((a, b) => a + b, 0) / optimizedTimes.length;

  const improvement = ((avgUnoptimized - avgOptimized) / avgUnoptimized) * 100;

  console.log("\n\n📈 Performance Comparison Results:");
  console.log("┌──────────────────────┬─────────────┬─────────────┬──────────────┐");
  console.log("│ Configuration        │ Avg Time    │ Min Time    │ Max Time     │");
  console.log("├──────────────────────┼─────────────┼─────────────┼──────────────┤");
  console.log(`│ Pre-optimization     │ ${avgUnoptimized.toFixed(2).padEnd(11)}ms │ ${Math.min(...unoptimizedTimes).toFixed(2).padEnd(11)}ms │ ${Math.max(...unoptimizedTimes).toFixed(2).padEnd(12)}ms │`);
  console.log(`│ Current (optimized)  │ ${avgOptimized.toFixed(2).padEnd(11)}ms │ ${Math.min(...optimizedTimes).toFixed(2).padEnd(11)}ms │ ${Math.max(...optimizedTimes).toFixed(2).padEnd(12)}ms │`);
  console.log("└──────────────────────┴─────────────┴─────────────┴──────────────┘");

  console.log(`\n🚀 Performance Improvement: ${improvement.toFixed(1)}%`);
  console.log(`⚡ Speed increase: ${(avgUnoptimized / avgOptimized).toFixed(1)}x faster`);

  return {
    unoptimized: avgUnoptimized,
    optimized: avgOptimized,
    improvement: improvement,
    speedIncrease: avgUnoptimized / avgOptimized
  };
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runPerformanceComparison().catch(console.error);
}

export { runPerformanceComparison };