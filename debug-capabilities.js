#!/usr/bin/env node

import { generateMcpCapabilities, generateEnhancedPromptContent } from "./brain-connection-ux.js";

console.log("=== Debugging Capability Detection Issues ===");

// Test with the exact same structure used in the failing tests
const configAnalysis = {
  mcpServers: ["memory", "supabase", "github"],
  builtInFeatures: {
    filesystem: { available: true },
    context7: { available: true },
    github: { available: true }
  }
};

console.log("\n1. Testing generateMcpCapabilities:");
console.log("Input configAnalysis:", JSON.stringify(configAnalysis, null, 2));

const capabilities = generateMcpCapabilities(configAnalysis);
console.log("Output capabilities:", capabilities ? `Array of ${capabilities.length} items` : "undefined/null");

if (capabilities) {
  console.log("\nCapability details:");
  capabilities.forEach((cap, i) => {
    console.log(`  ${i + 1}. ${cap.title}: ${cap.enabled ? 'ENABLED' : 'DISABLED'}`);
  });

  const enabledCount = capabilities.filter(cap => cap.enabled).length;
  console.log(`\nEnabled capabilities: ${enabledCount}/${capabilities.length}`);
}

console.log("\n2. Testing generateEnhancedPromptContent:");
const enhanced = generateEnhancedPromptContent(
  "/test/project",
  ["memory", "supabase", "github"],
  "Node.js",
  configAnalysis
);

console.log("enabledCapabilities:", enhanced?.enabledCapabilities);
console.log("totalCapabilities:", enhanced?.totalCapabilities);