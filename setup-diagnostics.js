/**
 * Setup Diagnostics Module for Claude MCP Configuration
 * REQ-302: Intelligent Setup Verification
 * REQ-310: Targeted Troubleshooting System
 */

import fs from "fs/promises";
import path from "path";
import os from "os";
import { analyzeClaudeConfiguration } from "./config-analyzer.js";

/**
 * Escapes text for safe inclusion in content
 */
function escapeText(text) {
  if (typeof text !== "string") return String(text);
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .replace(/\\/g, "&#x5C;");
}

/**
 * Common setup failure patterns and their diagnostics
 */
const COMMON_FAILURES = {
  FILESYSTEM_NOT_ENABLED: {
    title: "Filesystem Extension Not Enabled",
    description:
      "Claude cannot access your project files without filesystem extension",
    symptoms: [
      "Cannot read files",
      "Permission denied errors",
      "File not found errors",
    ],
    resolution: [
      "Open Claude Desktop application",
      "Navigate to Settings → Extensions",
      "Enable the 'Filesystem' extension",
      "Add your project directory to allowed paths",
      "Restart Claude Desktop application",
    ],
  },

  WORKSPACE_NOT_CONFIGURED: {
    title: "Workspace Path Not Configured",
    description:
      "Filesystem extension is enabled but your project directory is not included",
    symptoms: [
      "Claude cannot see project files",
      "Access denied to project folder",
    ],
    resolution: [
      "Open Claude Desktop application",
      "Go to Settings → Extensions → Filesystem",
      "Click 'Add Directory'",
      "Select your project root directory",
      "Ensure the path includes all subdirectories you need",
      "Save settings and restart Claude",
    ],
  },

  INVALID_MCP_TOKEN: {
    title: "Invalid or Expired MCP Authentication",
    description: "MCP server authentication has failed or expired",
    symptoms: [
      "Authentication errors",
      "Server connection failures",
      "Token expired messages",
    ],
    resolution: [
      "Check MCP server logs for authentication errors",
      "Regenerate authentication tokens if needed",
      "Verify server configuration in claude_desktop_config.json",
      "Restart Claude Desktop to refresh connections",
    ],
  },

  CONFIG_FILE_CORRUPTED: {
    title: "Configuration File Corrupted or Invalid",
    description:
      "Claude desktop configuration file has syntax errors or invalid structure",
    symptoms: [
      "Claude fails to start",
      "Settings not saving",
      "MCP servers not loading",
    ],
    resolution: [
      "Backup current configuration file",
      "Validate JSON syntax using a JSON validator",
      "Fix syntax errors or restore from backup",
      "Verify all MCP server paths are correct",
      "Restart Claude Desktop",
    ],
  },

  MCP_SERVER_NOT_RUNNING: {
    title: "MCP Servers Not Running or Accessible",
    description:
      "Required MCP servers are not responding or configured incorrectly",
    symptoms: [
      "Server timeout errors",
      "Connection refused",
      "Commands not working",
    ],
    resolution: [
      "Check if MCP server processes are running",
      "Verify server configuration paths and arguments",
      "Check server logs for startup errors",
      "Test server connectivity independently",
      "Restart MCP servers and Claude Desktop",
    ],
  },

  MULTIPLE_CLAUDE_INSTALLATIONS: {
    title: "Multiple Claude Installations Detected",
    description:
      "Multiple Claude installations may be causing configuration conflicts",
    symptoms: [
      "Settings not applying",
      "Inconsistent behavior",
      "Config file conflicts",
    ],
    resolution: [
      "Identify all Claude installation locations",
      "Uninstall duplicate or outdated versions",
      "Ensure single Claude installation is active",
      "Clear conflicting configuration files",
      "Reinstall Claude Desktop if necessary",
    ],
  },
};

/**
 * Detects common setup failures based on configuration analysis
 * REQ-310: Detect common setup failures (missing filesystem, invalid tokens, etc.)
 */
export function detectSetupFailures(configAnalysis, projectPath) {
  const failures = [];

  if (!configAnalysis.success) {
    // Configuration parsing failed
    if (configAnalysis.issues.includes("FILE_NOT_FOUND")) {
      failures.push({
        ...COMMON_FAILURES.CONFIG_FILE_CORRUPTED,
        type: "CONFIG_FILE_NOT_FOUND",
        severity: "critical",
        autoDetected: true,
        context: {
          configPath: configAnalysis.configPath,
          error: configAnalysis.error,
        },
      });
    } else if (configAnalysis.issues.includes("MALFORMED_JSON")) {
      failures.push({
        ...COMMON_FAILURES.CONFIG_FILE_CORRUPTED,
        type: "CONFIG_MALFORMED",
        severity: "critical",
        autoDetected: true,
        context: {
          configPath: configAnalysis.configPath,
          error: configAnalysis.error,
        },
      });
    }
    return failures;
  }

  // Check filesystem configuration
  if (!configAnalysis.servers.hasFilesystem) {
    failures.push({
      ...COMMON_FAILURES.FILESYSTEM_NOT_ENABLED,
      type: "FILESYSTEM_NOT_ENABLED",
      severity: "critical",
      autoDetected: true,
      context: {
        projectPath,
        configuredServers: configAnalysis.servers.servers,
      },
    });
  } else if (configAnalysis.servers.workspacePaths.length === 0) {
    failures.push({
      ...COMMON_FAILURES.WORKSPACE_NOT_CONFIGURED,
      type: "WORKSPACE_NOT_CONFIGURED",
      severity: "critical",
      autoDetected: true,
      context: {
        projectPath,
        filesystemEnabled: true,
      },
    });
  } else {
    // Check if current project is included in workspace paths
    const projectIncluded = configAnalysis.servers.workspacePaths.some(
      (workspacePath) =>
        projectPath.startsWith(workspacePath) ||
        workspacePath.startsWith(projectPath)
    );

    if (!projectIncluded) {
      failures.push({
        ...COMMON_FAILURES.WORKSPACE_NOT_CONFIGURED,
        title: "Current Project Not in Workspace Paths",
        type: "PROJECT_PATH_MISSING",
        severity: "high",
        autoDetected: true,
        context: {
          projectPath,
          configuredPaths: configAnalysis.servers.workspacePaths,
        },
      });
    }
  }

  // Check for server configuration issues
  if (configAnalysis.servers.issues.includes("FILESYSTEM_NO_ARGS")) {
    failures.push({
      ...COMMON_FAILURES.MCP_SERVER_NOT_RUNNING,
      title: "Filesystem Server Improperly Configured",
      type: "FILESYSTEM_CONFIG_INVALID",
      severity: "high",
      autoDetected: true,
      context: {
        issue: "Filesystem server has no arguments or invalid configuration",
      },
    });
  }

  return failures;
}

/**
 * Generates targeted troubleshooting steps based on detected issues
 * REQ-310: Provide specific, step-by-step resolution guidance
 */
export function generateTroubleshootingSteps(
  failures,
  configAnalysis,
  projectPath
) {
  if (failures.length === 0) {
    return {
      status: "healthy",
      message:
        "No setup issues detected. Your Claude MCP configuration appears to be working correctly.",
      steps: [],
    };
  }

  // Sort by severity (critical first)
  const sortedFailures = failures.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const troubleshootingSteps = [];

  sortedFailures.forEach((failure, index) => {
    troubleshootingSteps.push({
      step: index + 1,
      title: failure.title,
      description: failure.description,
      severity: failure.severity,
      actions: failure.resolution,
      context: failure.context,
      verification: generateVerificationSteps(failure.type, projectPath),
    });
  });

  return {
    status: "issues_detected",
    message: `Found ${failures.length} setup issue${failures.length > 1 ? "s" : ""} that need attention.`,
    criticalIssues: failures.filter((f) => f.severity === "critical").length,
    steps: troubleshootingSteps,
  };
}

/**
 * Generates verification steps to confirm issue resolution
 */
function generateVerificationSteps(failureType, projectPath) {
  const safePath = escapeText(projectPath);
  const verificationSteps = {
    FILESYSTEM_NOT_ENABLED: [
      "Open Claude and ask: 'Can you list the files in my project directory?'",
      "Claude should be able to see and list your project files",
      `Verify Claude can read files from: ${safePath}`,
    ],

    WORKSPACE_NOT_CONFIGURED: [
      "Open Claude and ask: 'What files are in my current project?'",
      "Claude should list files from your project directory",
      "Try asking Claude to read a specific file from your project",
    ],

    PROJECT_PATH_MISSING: [
      `Ask Claude: 'Can you access files in ${safePath}?'`,
      "Claude should confirm access to your project directory",
      "Test by asking Claude to analyze a file in your project",
    ],

    CONFIG_FILE_NOT_FOUND: [
      "Restart Claude Desktop application",
      "Check if Settings → Extensions menu is accessible",
      "Verify MCP servers load without errors",
    ],

    CONFIG_MALFORMED: [
      "Open Claude Desktop Settings",
      "Navigate to Extensions or Connectors",
      "Verify all configured servers show as active",
      "Test MCP functionality with a simple command",
    ],
  };

  return (
    verificationSteps[failureType] || [
      "Restart Claude Desktop application",
      "Test the specific functionality that was failing",
      "Verify the issue is resolved",
    ]
  );
}

/**
 * Performs comprehensive setup verification
 * REQ-302: Analyze actual Claude desktop configuration to detect what's configured vs missing
 */
export async function verifyClaudeSetup(projectPath, configPath = null) {
  try {
    // Analyze configuration
    const configAnalysis = await analyzeClaudeConfiguration(
      projectPath,
      configPath
    );

    // Detect common setup failures
    const failures = detectSetupFailures(configAnalysis, projectPath);

    // Generate troubleshooting guidance
    const troubleshooting = generateTroubleshootingSteps(
      failures,
      configAnalysis,
      projectPath
    );

    // Create summary
    const summary = {
      configurationValid: configAnalysis.success,
      filesystemEnabled: configAnalysis.servers?.hasFilesystem || false,
      workspaceConfigured:
        (configAnalysis.servers?.workspacePaths?.length || 0) > 0,
      projectIncluded:
        configAnalysis.servers?.workspacePaths?.some(
          (p) => projectPath.startsWith(p) || p.startsWith(projectPath)
        ) || false,
      recommendedExtensions: {
        context7: configAnalysis.servers?.hasContext7 || false,
        github: configAnalysis.servers?.hasGitHub || false,
      },
      totalServers: configAnalysis.servers?.servers?.length || 0,
    };

    return {
      success: true,
      summary,
      analysis: configAnalysis,
      failures,
      troubleshooting,
      recommendations: configAnalysis.recommendations || [],
    };
  } catch (error) {
    return {
      success: false,
      error: `Setup verification failed: ${error.message}`,
      summary: {
        configurationValid: false,
        filesystemEnabled: false,
        workspaceConfigured: false,
        projectIncluded: false,
        recommendedExtensions: { context7: false, github: false },
        totalServers: 0,
      },
      failures: [
        {
          ...COMMON_FAILURES.CONFIG_FILE_CORRUPTED,
          type: "VERIFICATION_ERROR",
          severity: "critical",
          autoDetected: true,
          context: { error: error.message },
        },
      ],
      troubleshooting: {
        status: "error",
        message: "Could not verify setup due to an unexpected error",
        steps: [
          {
            step: 1,
            title: "Setup Verification Error",
            description: `An error occurred during setup verification: ${error.message}`,
            severity: "critical",
            actions: [
              "Check that Claude Desktop is installed and running",
              "Verify file system permissions",
              "Try running the setup verification again",
              "Contact support if the issue persists",
            ],
          },
        ],
      },
    };
  }
}

/**
 * Handles edge cases like multiple Claude installations or custom configs
 * REQ-310: Handle edge cases like multiple Claude installations or custom configs
 */
export async function detectEdgeCases(projectPath) {
  const edgeCases = [];

  try {
    // Check for multiple potential Claude config locations
    const possibleConfigPaths = [
      path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "Claude",
        "claude_desktop_config.json"
      ), // macOS
      path.join(
        os.homedir(),
        "AppData",
        "Roaming",
        "Claude",
        "claude_desktop_config.json"
      ), // Windows
      path.join(
        os.homedir(),
        ".config",
        "claude",
        "claude_desktop_config.json"
      ), // Linux
      path.join(os.homedir(), ".claude", "config.json"), // Custom location
      path.join(projectPath, "claude.config.json"), // Project-specific config
    ];

    const existingConfigs = [];
    for (const configPath of possibleConfigPaths) {
      try {
        await fs.access(configPath);
        existingConfigs.push(configPath);
      } catch {
        // Config doesn't exist at this location
      }
    }

    if (existingConfigs.length > 1) {
      edgeCases.push({
        type: "MULTIPLE_CONFIG_FILES",
        severity: "medium",
        title: "Multiple Configuration Files Found",
        description: "Found Claude configuration files in multiple locations",
        context: { configPaths: existingConfigs },
        resolution: [
          "Determine which configuration file Claude is actually using",
          "Consolidate settings into the primary configuration file",
          "Remove or rename duplicate configuration files",
          "Verify settings are applied correctly",
        ],
      });
    }

    // Check for project-specific configurations that might conflict
    const projectConfigPath = path.join(projectPath, "claude.config.json");
    try {
      await fs.access(projectConfigPath);
      edgeCases.push({
        type: "PROJECT_SPECIFIC_CONFIG",
        severity: "low",
        title: "Project-Specific Claude Configuration Detected",
        description:
          "Found a Claude configuration file in the project directory",
        context: { projectConfigPath },
        resolution: [
          "Ensure project config doesn't conflict with global settings",
          "Consider if project-specific settings are necessary",
          "Document project-specific configuration requirements",
        ],
      });
    } catch {
      // No project-specific config
    }
  } catch (error) {
    edgeCases.push({
      type: "EDGE_CASE_DETECTION_ERROR",
      severity: "low",
      title: "Could Not Detect Configuration Edge Cases",
      description: `Error during edge case detection: ${error.message}`,
      context: { error: error.message },
    });
  }

  return edgeCases;
}

// Aliases for test compatibility  
export const analyzeSetupConfiguration = verifyClaudeSetup;
export const checkFilesystemAccess = async (workspacePaths) => {
  const results = [];
  for (const workspacePath of workspacePaths) {
    try {
      await fs.access(workspacePath, fs.constants.R_OK);
      results.push({ path: workspacePath, accessible: true });
    } catch (error) {
      results.push({ path: workspacePath, accessible: false, error: error.message });
    }
  }
  return results;
};
export const detectOptionalExtensions = (configAnalysis) => {
  return configAnalysis.recommendations.filter(r => r.priority === "recommended");
};
export const detectCommonSetupFailures = detectSetupFailures;
export const handleSetupEdgeCases = detectEdgeCases;
export const generateContextAwareTroubleshooting = generateTroubleshootingSteps;
export const validateWorkspaceAccess = checkFilesystemAccess;

export default verifyClaudeSetup;
