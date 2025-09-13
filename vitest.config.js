import { defineConfig } from "vitest/config";

export function removeShebang(code) {
  if (code.startsWith("#!")) {
    return code.replace(/^#!.*\r?\n?/, "");
  }
  return code;
}

export default defineConfig({
  plugins: [
    {
      name: "remove-shebang",
      transform(code, id) {
        // Skip non-JavaScript files for performance
        if (id && !id.endsWith(".js")) {
          return code;
        }
        return removeShebang(code);
      },
    },
  ],
  test: {
    // REQ-501, REQ-502, REQ-503: Configure vitest for clean exit without hanging processes
    pool: "threads", // Use thread pool with constraints
    poolOptions: {
      threads: {
        singleThread: true, // Use single thread to prevent process accumulation
        minThreads: 1,
        maxThreads: 1,
      },
    },
    maxConcurrency: 1, // Run tests sequentially
    fileParallelism: false, // Disable parallel file execution
    isolate: false, // Disable test isolation to reduce overhead
    watch: false, // Explicitly disable watch mode
    reporter: ["basic"], // Use basic reporter
    testTimeout: 30000, // Reasonable timeout
    hookTimeout: 10000, // Shorter hook timeout
    teardownTimeout: 5000, // Shorter teardown timeout
  },
});
