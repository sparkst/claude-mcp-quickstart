#!/usr/bin/env node

/**
 * Performance Monitor for Claude MCP Quickstart CLI
 * REQ-PERF-001: Monitor startup performance and detect regressions
 */

import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * REQ-PERF-002: Performance benchmark configuration
 */
const PERFORMANCE_CONFIG = {
  // Target performance thresholds (milliseconds)
  targets: {
    version: 200, // --version command should be < 200ms (realistic with Node.js startup)
    help: 250, // --help command should be < 250ms (realistic with module loading)
    setup: 5000, // setup command should start < 5s
  },

  // Test iterations for accurate measurements
  iterations: 5,

  // Commands to benchmark
  commands: [
    { name: "version", args: ["--version"], expectOutput: true },
    { name: "help", args: ["--help"], expectOutput: true },
  ],
};

/**
 * REQ-PERF-003: Measure command execution time
 * @param {string[]} args - Command arguments
 * @param {boolean} expectOutput - Whether command should produce output
 * @returns {Promise<number>} - Execution time in milliseconds
 */
async function measureCommand(args, expectOutput = true) {
  return new Promise((resolve, reject) => {
    const startTime = process.hrtime.bigint();

    const child = spawn("node", [path.join(__dirname, "index.js"), ...args], {
      stdio: expectOutput ? "pipe" : "ignore",
      env: { ...process.env, NODE_ENV: "benchmark" },
    });

    let output = "";
    if (expectOutput) {
      child.stdout.on("data", (data) => {
        output += data.toString();
      });
    }

    child.on("close", (code) => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      if (code === 0) {
        resolve(duration);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on("error", reject);
  });
}

/**
 * REQ-PERF-004: Run performance benchmark suite
 * @returns {Promise<Object>} - Benchmark results
 */
async function runBenchmarks() {
  const results = {};

  console.log("🚀 Running CLI Performance Benchmarks...\n");

  for (const command of PERFORMANCE_CONFIG.commands) {
    console.log(`📊 Benchmarking: ${command.name}`);
    const measurements = [];

    // Warm up run (not counted)
    await measureCommand(command.args, command.expectOutput);

    // Actual measurements
    for (let i = 0; i < PERFORMANCE_CONFIG.iterations; i++) {
      try {
        const duration = await measureCommand(
          command.args,
          command.expectOutput
        );
        measurements.push(duration);
        process.stdout.write(".");
      } catch (error) {
        console.error(`\n❌ Error in iteration ${i + 1}:`, error.message);
        throw error;
      }
    }

    // Calculate statistics
    const sorted = measurements.sort((a, b) => a - b);
    const stats = {
      min: Math.round(sorted[0] * 100) / 100,
      max: Math.round(sorted[sorted.length - 1] * 100) / 100,
      median: Math.round(sorted[Math.floor(sorted.length / 2)] * 100) / 100,
      average:
        Math.round((sorted.reduce((a, b) => a + b, 0) / sorted.length) * 100) /
        100,
      target: PERFORMANCE_CONFIG.targets[command.name],
      measurements,
    };

    results[command.name] = stats;

    const passed = stats.median <= stats.target;
    const emoji = passed ? "✅" : "❌";
    const status = passed ? "PASS" : "FAIL";

    console.log(
      `\n${emoji} ${command.name}: ${stats.median}ms (target: ${stats.target}ms) - ${status}\n`
    );
  }

  return results;
}

/**
 * REQ-PERF-005: Generate performance report
 * @param {Object} results - Benchmark results
 */
function generateReport(results) {
  console.log("📈 Performance Report Summary\n");
  console.log(
    "┌─────────────┬─────────┬─────────┬─────────┬─────────┬────────┐"
  );
  console.log(
    "│ Command     │ Min     │ Median  │ Max     │ Target  │ Status │"
  );
  console.log(
    "├─────────────┼─────────┼─────────┼─────────┼─────────┼────────┤"
  );

  for (const [command, stats] of Object.entries(results)) {
    const passed = stats.median <= stats.target;
    const status = passed ? "✅ PASS" : "❌ FAIL";

    console.log(
      `│ ${command.padEnd(11)} │ ${stats.min.toString().padEnd(7)} │ ${stats.median.toString().padEnd(7)} │ ${stats.max.toString().padEnd(7)} │ ${stats.target.toString().padEnd(7)} │ ${status} │`
    );
  }

  console.log(
    "└─────────────┴─────────┴─────────┴─────────┴─────────┴────────┘\n"
  );

  // Overall assessment
  const allPassed = Object.values(results).every(
    (stats) => stats.median <= stats.target
  );
  const overallEmoji = allPassed ? "🎉" : "⚠️";
  const overallStatus = allPassed
    ? "ALL PERFORMANCE TARGETS MET"
    : "PERFORMANCE REGRESSIONS DETECTED";

  console.log(`${overallEmoji} ${overallStatus}\n`);

  return allPassed;
}

/**
 * REQ-PERF-006: Save benchmark results for trend analysis
 * @param {Object} results - Benchmark results
 */
async function saveBenchmarkResults(results) {
  const timestamp = new Date().toISOString();
  const benchmarkData = {
    timestamp,
    results,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };

  const benchmarkDir = path.join(__dirname, ".performance");
  await fs.mkdir(benchmarkDir, { recursive: true });

  const filename = `benchmark-${timestamp.replace(/[:.]/g, "-")}.json`;
  const filePath = path.join(benchmarkDir, filename);

  await fs.writeFile(filePath, JSON.stringify(benchmarkData, null, 2));
  console.log(`💾 Benchmark results saved to: ${filePath}\n`);
}

/**
 * REQ-PERF-007: Main benchmark execution
 */
async function main() {
  try {
    const results = await runBenchmarks();
    const allPassed = generateReport(results);
    await saveBenchmarkResults(results);

    // Exit with error code if performance targets not met
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error("❌ Benchmark failed:", error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { runBenchmarks, measureCommand, PERFORMANCE_CONFIG };
