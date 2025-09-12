import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import chalk from "chalk";
import path from "path";

// These modules will need to be implemented or extended
import {
  generateStreamlinedConnectionOutput,
  createEnhancedPromptContent,
  generateProfessionalUXMessaging,
  displayFullFilePaths,
  generatePracticalExampleLibrary,
  generateMCPCapabilityShowcase,
  formatConnectionMessage,
  createActionablePrompts,
  showcaseUniqueCapabilities,
} from "./brain-connection-ux.js";

describe("REQ-301: Streamlined Connection Output", () => {
  const mockProjectPath = "/Users/test/workspace/my-project";
  const mockMcpServers = ["filesystem", "memory", "supabase"];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("REQ-301 — replaces verbose output with clean, scannable professional messaging", () => {
    const connectionOutput = generateStreamlinedConnectionOutput(
      mockProjectPath,
      mockMcpServers
    );

    expect(connectionOutput).not.toContain("verbose");
    expect(connectionOutput).not.toContain("repetitive");
    expect(connectionOutput.lines.length).toBeLessThanOrEqual(5);
    expect(connectionOutput).toHaveProperty("style", "professional");
    expect(connectionOutput).toHaveProperty("scannable", true);
    expect(connectionOutput.message).toContain("Ready to connect");
  });

  test("REQ-301 — displays full file paths instead of basenames in user instructions", () => {
    const connectionOutput = generateStreamlinedConnectionOutput(
      mockProjectPath,
      mockMcpServers
    );

    expect(connectionOutput.filePaths).toEqual(expect.any(Array));
    expect(connectionOutput.filePaths[0]).toBe(
      path.join(mockProjectPath, "connect_claude_brain.md")
    );
    expect(connectionOutput.filePaths).not.toContain("connect_claude_brain.md");
    expect(connectionOutput).toHaveProperty("useFullPaths", true);
  });

  test("REQ-301 — eliminates repetitive text and focuses on clear next steps", () => {
    const connectionOutput = generateStreamlinedConnectionOutput(
      mockProjectPath,
      mockMcpServers
    );

    expect(connectionOutput).toHaveProperty("nextSteps");
    expect(connectionOutput.nextSteps).toEqual(expect.any(Array));
    expect(connectionOutput.nextSteps.length).toBeGreaterThan(0);
    expect(connectionOutput.nextSteps[0]).toHaveProperty("action");
    expect(connectionOutput.nextSteps[0]).toHaveProperty("description");
    expect(connectionOutput.repetitiveContent).toBe(false);
  });

  test("REQ-301 — maintains existing security measures while improving UX", () => {
    const connectionOutput = generateStreamlinedConnectionOutput(
      mockProjectPath,
      mockMcpServers
    );

    expect(connectionOutput).toHaveProperty("securityMaintained", true);
    expect(connectionOutput).toHaveProperty("sanitizedPaths", true);
    expect(connectionOutput.message).not.toContain("<script>");
    expect(connectionOutput.message).not.toContain("eval(");
  });

  test("REQ-301 — reduces verbose output to under 7 lines", () => {
    const connectionOutput = generateStreamlinedConnectionOutput(
      mockProjectPath,
      mockMcpServers
    );

    const messageLines = connectionOutput.message
      .split("\n")
      .filter((line) => line.trim());
    expect(messageLines.length).toBeLessThan(7);
    expect(connectionOutput).toHaveProperty("concise", true);
  });
});

describe("REQ-303: Enhanced Prompt Content Generation", () => {
  const mockProjectPath = "/Users/test/workspace/my-project";
  const mockMcpServers = ["filesystem", "memory", "supabase"];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("REQ-303 — replaces generic content with practical, actionable examples", () => {
    const enhancedContent = createEnhancedPromptContent(
      mockProjectPath,
      mockMcpServers
    );

    expect(enhancedContent).toHaveProperty("generic", false);
    expect(enhancedContent).toHaveProperty("actionable", true);
    expect(enhancedContent.examples).toEqual(expect.any(Array));
    expect(enhancedContent.examples[0]).toHaveProperty("copyPasteReady", true);
    expect(enhancedContent.examples[0]).toHaveProperty("immediate", true);
  });

  test("REQ-303 — includes 10 specific MCP-enhanced prompts users can try immediately", () => {
    const practicalPrompts = createActionablePrompts(mockMcpServers);

    expect(practicalPrompts).toHaveProperty("count", 10);
    expect(practicalPrompts.prompts).toEqual(expect.any(Array));
    expect(practicalPrompts.prompts).toHaveLength(10);
    expect(practicalPrompts.prompts[0]).toHaveProperty("text");
    expect(practicalPrompts.prompts[0]).toHaveProperty("mcpEnhanced", true);
    expect(practicalPrompts.prompts[0]).toHaveProperty(
      "immediatelyUsable",
      true
    );
  });

  test("REQ-303 — showcases 10 unique capabilities unlocked by MCP setup", () => {
    const capabilities = showcaseUniqueCapabilities(mockMcpServers);

    expect(capabilities).toHaveProperty("count", 10);
    expect(capabilities.capabilities).toEqual(expect.any(Array));
    expect(capabilities.capabilities).toHaveLength(10);
    expect(capabilities.capabilities[0]).toHaveProperty("name");
    expect(capabilities.capabilities[0]).toHaveProperty("description");
    expect(capabilities.capabilities[0]).toHaveProperty("mcpUnique", true);
    expect(capabilities.capabilities[0]).toHaveProperty("beforeMcp", false);
  });

  test("REQ-303 — provides copy-paste ready examples for Supabase and memory usage", () => {
    const enhancedContent = createEnhancedPromptContent(
      mockProjectPath,
      mockMcpServers
    );

    const supabaseExamples = enhancedContent.examples.filter(
      (ex) => ex.server === "supabase"
    );
    const memoryExamples = enhancedContent.examples.filter(
      (ex) => ex.server === "memory"
    );

    expect(supabaseExamples).toHaveLength(expect.any(Number));
    expect(supabaseExamples.length).toBeGreaterThan(0);
    expect(memoryExamples).toHaveLength(expect.any(Number));
    expect(memoryExamples.length).toBeGreaterThan(0);

    expect(supabaseExamples[0]).toHaveProperty("copyPasteReady", true);
    expect(supabaseExamples[0].prompt).toContain("supabase");
    expect(memoryExamples[0]).toHaveProperty("copyPasteReady", true);
    expect(memoryExamples[0].prompt).toContain("memory");
  });

  test("REQ-303 — maintains template security while adding value", () => {
    const enhancedContent = createEnhancedPromptContent(
      mockProjectPath,
      mockMcpServers
    );

    expect(enhancedContent).toHaveProperty("templateSecure", true);
    expect(enhancedContent).toHaveProperty("sanitized", true);
    expect(enhancedContent.examples[0].prompt).not.toContain("<script>");
    expect(enhancedContent.examples[0].prompt).not.toContain("javascript:");
  });
});

describe("REQ-305: Professional UX Messaging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("REQ-305 — replaces unix-style command output with professional developer tool messaging", () => {
    const professionalMessage = generateProfessionalUXMessaging({
      type: "connection_ready",
      servers: ["filesystem", "memory"],
      path: "/workspace",
    });

    expect(professionalMessage).not.toMatch(/\$\s/); // No command prompt style
    expect(professionalMessage).not.toMatch(/^\s*>/); // No unix redirections
    expect(professionalMessage).toHaveProperty("style", "professional");
    expect(professionalMessage.message).toContain("Ready");
    expect(professionalMessage).toHaveProperty("developerFriendly", true);
  });

  test("REQ-305 — uses consistent visual hierarchy and chalk color patterns", () => {
    const formattedMessage = formatConnectionMessage({
      title: "Connection Ready",
      details: "MCP servers configured",
      actions: ["Open Claude", "Upload prompt"],
    });

    expect(formattedMessage).toHaveProperty("usesChalk", true);
    expect(formattedMessage).toHaveProperty("hierarchy", "consistent");
    expect(formattedMessage.coloredOutput).toContain(chalk.cyan(""));
    expect(formattedMessage.coloredOutput).toContain(chalk.green(""));
    expect(formattedMessage).toHaveProperty("visuallyStructured", true);
  });

  test("REQ-305 — provides specific, actionable guidance instead of generic suggestions", () => {
    const guidance = generateProfessionalUXMessaging({
      type: "next_steps",
      context: { configured: ["filesystem"], missing: ["github"] },
    });

    expect(guidance).toHaveProperty("specific", true);
    expect(guidance).toHaveProperty("actionable", true);
    expect(guidance.guidance).toEqual(expect.any(Array));
    expect(guidance.guidance[0]).toHaveProperty("action");
    expect(guidance.guidance[0]).toHaveProperty("specificity", "high");
    expect(guidance.guidance[0].action).not.toContain("maybe");
    expect(guidance.guidance[0].action).not.toContain("consider");
  });

  test("REQ-305 — maintains existing security and error handling patterns", () => {
    const secureMessage = generateProfessionalUXMessaging({
      type: "error",
      error: "Configuration failed",
      userInput: "<script>alert('xss')</script>",
    });

    expect(secureMessage).toHaveProperty("securityMaintained", true);
    expect(secureMessage).toHaveProperty("errorHandlingPreserved", true);
    expect(secureMessage.message).not.toContain("<script>");
    expect(secureMessage.sanitizedInput).toBe(
      "&lt;script&gt;alert('xss')&lt;/script&gt;"
    );
  });

  test("REQ-305 — follows modern developer tool UX patterns", () => {
    const modernUX = generateProfessionalUXMessaging({
      type: "status_update",
      progress: "connecting",
    });

    expect(modernUX).toHaveProperty("modernUX", true);
    expect(modernUX).toHaveProperty("followsPatterns", [
      "vscode",
      "github",
      "vercel",
    ]);
    expect(modernUX.message).not.toContain("✓"); // Avoids basic checkmarks
    expect(modernUX).toHaveProperty("progressIndicator", true);
  });
});

describe("REQ-306: Full File Path Display", () => {
  const mockProjectPath = "/Users/test/workspace/my-project";

  test("REQ-306 — shows complete file paths in all user instructions and guidance", () => {
    const pathDisplay = displayFullFilePaths(mockProjectPath, [
      "connect_claude_brain.md",
      "claude_brain_connected.json",
    ]);

    expect(pathDisplay.paths).toEqual(expect.any(Array));
    expect(pathDisplay.paths[0]).toBe(
      "/Users/test/workspace/my-project/connect_claude_brain.md"
    );
    expect(pathDisplay.paths[1]).toBe(
      "/Users/test/workspace/my-project/claude_brain_connected.json"
    );
    expect(pathDisplay).toHaveProperty("allAbsolute", true);
  });

  test("REQ-306 — replaces relative paths and basenames with absolute paths", () => {
    const pathDisplay = displayFullFilePaths(mockProjectPath, [
      "./config.json",
      "../parent/file.txt",
      "simple-file.md",
    ]);

    expect(pathDisplay.paths[0]).toBe(
      "/Users/test/workspace/my-project/config.json"
    );
    expect(pathDisplay.paths[1]).toBe("/Users/test/workspace/parent/file.txt");
    expect(pathDisplay.paths[2]).toBe(
      "/Users/test/workspace/my-project/simple-file.md"
    );
    expect(pathDisplay).toHaveProperty("relativesReplaced", true);
    expect(pathDisplay).toHaveProperty("basenamesReplaced", true);
  });

  test("REQ-306 — makes file locations copy-paste ready for user convenience", () => {
    const pathDisplay = displayFullFilePaths(mockProjectPath, ["README.md"]);

    expect(pathDisplay.paths[0]).toMatch(/^\/[\w/-]+$/); // Full path format
    expect(pathDisplay).toHaveProperty("copyPasteReady", true);
    expect(pathDisplay).toHaveProperty("quoted", false); // No quotes needed
    expect(pathDisplay.formattedPaths[0]).toBe(
      "/Users/test/workspace/my-project/README.md"
    );
  });

  test("REQ-306 — preserves existing file locations while showing absolute paths", () => {
    const pathDisplay = displayFullFilePaths(mockProjectPath, ["existing.js"]);

    expect(pathDisplay).toHaveProperty("preservesLocations", true);
    expect(pathDisplay).toHaveProperty("pathResolutionIntact", true);
    expect(pathDisplay.originalBasenames).toContain("existing.js");
    expect(pathDisplay.paths[0]).toContain("existing.js");
  });

  test("REQ-306 — handles special characters in file paths", () => {
    const pathDisplay = displayFullFilePaths(mockProjectPath, [
      "file with spaces.txt",
      "special-chars_@#.json",
    ]);

    expect(pathDisplay.paths[0]).toBe(
      "/Users/test/workspace/my-project/file with spaces.txt"
    );
    expect(pathDisplay.paths[1]).toBe(
      "/Users/test/workspace/my-project/special-chars_@#.json"
    );
    expect(pathDisplay).toHaveProperty("handlesSpecialChars", true);
  });
});

describe("REQ-307: Practical Example Library", () => {
  const mockMcpServers = ["filesystem", "memory", "supabase"];

  test("REQ-307 — generates 10 actionable MCP prompts covering common development tasks", () => {
    const exampleLibrary = generatePracticalExampleLibrary(mockMcpServers);

    expect(exampleLibrary).toHaveProperty("count", 10);
    expect(exampleLibrary.examples).toHaveLength(10);
    expect(exampleLibrary.examples[0]).toHaveProperty(
      "task",
      "common_development"
    );
    expect(exampleLibrary.examples[0]).toHaveProperty("actionable", true);
    expect(exampleLibrary.examples[0]).toHaveProperty("mcpEnhanced", true);
  });

  test("REQ-307 — includes specific Supabase design check and table update examples", () => {
    const exampleLibrary = generatePracticalExampleLibrary(mockMcpServers);

    const supabaseExamples = exampleLibrary.examples.filter(
      (ex) => ex.server === "supabase"
    );

    const designCheckExample = supabaseExamples.find((ex) =>
      ex.prompt.toLowerCase().includes("design")
    );
    const tableUpdateExample = supabaseExamples.find(
      (ex) =>
        ex.prompt.toLowerCase().includes("table") &&
        ex.prompt.toLowerCase().includes("update")
    );

    expect(designCheckExample).toBeDefined();
    expect(tableUpdateExample).toBeDefined();
    expect(designCheckExample).toHaveProperty("specific", "design_check");
    expect(tableUpdateExample).toHaveProperty("specific", "table_update");
  });

  test("REQ-307 — shows explicit memory saving and retrieval examples", () => {
    const exampleLibrary = generatePracticalExampleLibrary(mockMcpServers);

    const memoryExamples = exampleLibrary.examples.filter(
      (ex) => ex.server === "memory"
    );

    const saveExample = memoryExamples.find((ex) =>
      ex.prompt.toLowerCase().includes("save")
    );
    const retrieveExample = memoryExamples.find(
      (ex) =>
        ex.prompt.toLowerCase().includes("retrieve") ||
        ex.prompt.toLowerCase().includes("recall")
    );

    expect(saveExample).toBeDefined();
    expect(retrieveExample).toBeDefined();
    expect(saveExample).toHaveProperty("operation", "save");
    expect(retrieveExample).toHaveProperty("operation", "retrieve");
  });

  test("REQ-307 — ensures all examples are copy-paste ready and immediately useful", () => {
    const exampleLibrary = generatePracticalExampleLibrary(mockMcpServers);

    exampleLibrary.examples.forEach((example) => {
      expect(example).toHaveProperty("copyPasteReady", true);
      expect(example).toHaveProperty("immediatelyUseful", true);
      expect(example.prompt).toEqual(expect.any(String));
      expect(example.prompt.length).toBeGreaterThan(10);
      expect(example.prompt).not.toContain("[PLACEHOLDER]");
    });
  });

  test("REQ-307 — demonstrates clear value proposition of MCP setup", () => {
    const exampleLibrary = generatePracticalExampleLibrary(mockMcpServers);

    expect(exampleLibrary).toHaveProperty("valueProposition", "clear");
    expect(exampleLibrary).toHaveProperty("mcpValue", "demonstrated");

    exampleLibrary.examples.forEach((example) => {
      expect(example).toHaveProperty("valueDemo", true);
      expect(example).toHaveProperty("beforeAfter");
      expect(example.beforeAfter).toHaveProperty("withoutMcp");
      expect(example.beforeAfter).toHaveProperty("withMcp");
    });
  });
});

describe("REQ-308: MCP Capability Showcase", () => {
  const mockMcpServers = [
    "filesystem",
    "memory",
    "supabase",
    "context7",
    "github",
  ];

  test("REQ-308 — highlights 10 specific capabilities enabled by MCP that weren't possible before", () => {
    const capabilityShowcase = generateMCPCapabilityShowcase(mockMcpServers);

    expect(capabilityShowcase).toHaveProperty("count", 10);
    expect(capabilityShowcase.capabilities).toHaveLength(10);

    capabilityShowcase.capabilities.forEach((capability) => {
      expect(capability).toHaveProperty("enabledByMCP", true);
      expect(capability).toHaveProperty("previouslyImpossible", true);
      expect(capability).toHaveProperty("specific", true);
    });
  });

  test("REQ-308 — focuses on meaningful, practical benefits rather than technical features", () => {
    const capabilityShowcase = generateMCPCapabilityShowcase(mockMcpServers);

    capabilityShowcase.capabilities.forEach((capability) => {
      expect(capability).toHaveProperty("practical", true);
      expect(capability).toHaveProperty("meaningful", true);
      expect(capability.description).not.toContain("API");
      expect(capability.description).not.toContain("protocol");
      expect(capability.description).not.toContain("implementation");
      expect(capability).toHaveProperty("userBenefit");
    });
  });

  test("REQ-308 — connects capabilities to user's actual project context and setup", () => {
    const projectContext = {
      projectType: "Node.js",
      framework: "Express",
      database: "PostgreSQL",
    };

    const capabilityShowcase = generateMCPCapabilityShowcase(
      mockMcpServers,
      projectContext
    );

    expect(capabilityShowcase).toHaveProperty("contextAware", true);

    capabilityShowcase.capabilities.forEach((capability) => {
      expect(capability).toHaveProperty("projectRelevant", true);
      expect(capability).toHaveProperty("contextSpecific", true);
      expect(capability.examples).toEqual(expect.any(Array));
      expect(capability.examples[0]).toContain("Node.js");
    });
  });

  test("REQ-308 — avoids marketing copy and overwhelming technical detail", () => {
    const capabilityShowcase = generateMCPCapabilityShowcase(mockMcpServers);

    capabilityShowcase.capabilities.forEach((capability) => {
      expect(capability).toHaveProperty("marketingFree", true);
      expect(capability).toHaveProperty("technicalComplexity", "low");
      expect(capability.description).not.toContain("revolutionary");
      expect(capability.description).not.toContain("cutting-edge");
      expect(capability.description).not.toContain("enterprise-grade");
      expect(capability.description.length).toBeLessThan(200); // Concise
    });
  });

  test("REQ-308 — demonstrates immediate ROI understanding for setup effort", () => {
    const capabilityShowcase = generateMCPCapabilityShowcase(mockMcpServers);

    expect(capabilityShowcase).toHaveProperty("roiClear", true);
    expect(capabilityShowcase).toHaveProperty("immediateValue", true);

    capabilityShowcase.capabilities.forEach((capability) => {
      expect(capability).toHaveProperty("timeSpent");
      expect(capability).toHaveProperty("timeSaved");
      expect(capability.timeSaved).toBeGreaterThan(capability.timeSpent);
      expect(capability).toHaveProperty("roi");
      expect(capability.roi).toBeGreaterThan(1);
    });
  });

  test("REQ-308 — shows unique capabilities not available without MCP", () => {
    const capabilityShowcase = generateMCPCapabilityShowcase(mockMcpServers);

    const uniqueCapabilities = capabilityShowcase.capabilities.filter(
      (cap) => cap.uniqueToMcp === true
    );

    expect(uniqueCapabilities).toHaveLength(10); // All should be unique to MCP

    uniqueCapabilities.forEach((capability) => {
      expect(capability).toHaveProperty("alternativeExists", false);
      expect(capability).toHaveProperty("mcpExclusive", true);
      expect(capability.beforeMcp).toBe("not possible");
    });
  });
});
