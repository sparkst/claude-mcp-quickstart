/**
 * Configuration Analysis Engine for Claude MCP Setup
 * REQ-304: Parse claude_desktop_config.json to determine actual server states
 * REQ-309: Handle malformed configuration files gracefully
 */

import fs from "fs/promises";
import path from "path";
import os from "os";

/**
 * Gets the Claude desktop configuration file path
 * Reuses patterns from setup.js getConfigPath()
 */
export function getClaudeConfigPath() {
  const platform = process.platform;

  if (platform === "darwin") {
    return path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "Claude",
      "claude_desktop_config.json"
    );
  } else if (platform === "win32") {
    return path.join(
      os.homedir(),
      "AppData",
      "Roaming",
      "Claude",
      "claude_desktop_config.json"
    );
  } else {
    // Linux and other Unix-like systems
    return path.join(
      os.homedir(),
      ".config",
      "claude",
      "claude_desktop_config.json"
    );
  }
}

/**
 * Safely parses Claude configuration with error handling
 * REQ-309: Handle malformed, missing, or incomplete configuration files
 */
export async function parseClaudeConfig(configPath = null) {
  const finalPath = configPath || getClaudeConfigPath();

  try {
    // Check if file exists and is readable
    await fs.access(finalPath);
    const content = await fs.readFile(finalPath, "utf8");

    if (!content.trim()) {
      return {
        success: false,
        error: "Configuration file is empty",
        config: null,
        issues: ["EMPTY_CONFIG"],
        fallbackConfig: { mcpServers: {} },
      };
    }

    let config;
    try {
      config = JSON.parse(content);
    } catch (parseError) {
      return {
        success: false,
        error: `JSON syntax error: ${parseError.message}`,
        config: null,
        issues: ["MALFORMED_JSON"],
        errorDetails: parseError.message,
      };
    }

    // Validate basic structure
    if (!config || typeof config !== "object") {
      return {
        success: false,
        error: "Configuration is not a valid object",
        config: null,
        issues: ["INVALID_STRUCTURE"],
      };
    }

    // Check for incomplete config
    let warning = null;
    if (config.mcpServers === null || config.mcpServers === undefined) {
      warning =
        "Configuration appears incomplete - mcpServers section is missing or null";
    }

    return {
      success: true,
      error: null,
      config,
      issues: [],
      warning,
      mcpServers: warning ? {} : config.mcpServers,
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        success: false,
        error: "Configuration file not found",
        config: null,
        issues: ["FILE_NOT_FOUND"],
        fallbackConfig: { mcpServers: {} },
      };
    } else if (error.code === "EACCES") {
      return {
        success: false,
        error: "Cannot read configuration file - permission denied",
        config: null,
        issues: ["PERMISSION_DENIED"],
        fallbackConfig: { mcpServers: {} },
      };
    } else {
      return {
        success: false,
        error: `Configuration read error: ${error.message}`,
        config: null,
        issues: ["READ_ERROR"],
        fallbackConfig: { mcpServers: {} },
      };
    }
  }
}

/**
 * Analyzes MCP server configuration states
 * REQ-304: Detect filesystem server configuration and workspace paths
 */
export function analyzeMcpServers(config) {
  if (!config || !config.mcpServers) {
    return {
      servers: [],
      hasFilesystem: false,
      hasContext7: false,
      hasGitHub: false,
      workspacePaths: [],
      issues: ["NO_MCP_SERVERS"],
    };
  }

  const servers = Object.keys(config.mcpServers);
  const serverConfigs = config.mcpServers;

  // Detect specific server types
  const hasFilesystem = servers.some(
    (name) =>
      name.toLowerCase().includes("filesystem") ||
      name.toLowerCase().includes("file")
  );

  const hasContext7 = servers.some(
    (name) =>
      name.toLowerCase().includes("context7") ||
      name.toLowerCase().includes("context")
  );

  const hasGitHub = servers.some(
    (name) =>
      name.toLowerCase().includes("github") ||
      name.toLowerCase().includes("git")
  );

  // Extract workspace paths from filesystem server
  const workspacePaths = [];
  const issues = [];

  for (const [serverName, serverConfig] of Object.entries(serverConfigs)) {
    if (
      serverName.toLowerCase().includes("filesystem") ||
      serverName.toLowerCase().includes("file")
    ) {
      if (serverConfig.args && Array.isArray(serverConfig.args)) {
        // Look for paths in args
        const pathArgs = serverConfig.args.filter(
          (arg) =>
            typeof arg === "string" &&
            (arg.startsWith("/") || arg.includes(":\\"))
        );
        workspacePaths.push(...pathArgs);
      }

      if (serverConfig.env && serverConfig.env.ALLOWED_DIRECTORIES) {
        workspacePaths.push(serverConfig.env.ALLOWED_DIRECTORIES);
      }

      // Check if filesystem server is properly configured
      if (!serverConfig.args || serverConfig.args.length === 0) {
        issues.push("FILESYSTEM_NO_ARGS");
      }
    }
  }

  return {
    servers,
    hasFilesystem,
    hasContext7,
    hasGitHub,
    workspacePaths,
    issues,
  };
}

/**
 * Generates missing extension recommendations
 * REQ-304: Identify missing recommended extensions with specific setup guidance
 */
export function generateSetupRecommendations(serverAnalysis, projectPath) {
  const recommendations = [];

  if (!serverAnalysis.hasFilesystem) {
    recommendations.push({
      type: "MISSING_FILESYSTEM",
      priority: "critical",
      title: "Filesystem Access Required",
      description:
        "Claude needs filesystem access to read and modify your project files",
      setupSteps: [
        "Open Claude Desktop application",
        "Go to Settings → Extensions",
        "Enable 'Filesystem' extension",
        `Add your project directory: ${projectPath}`,
        "Restart Claude Desktop",
      ],
    });
  } else if (serverAnalysis.workspacePaths.length === 0) {
    recommendations.push({
      type: "FILESYSTEM_NO_WORKSPACE",
      priority: "critical",
      title: "No Workspace Paths Configured",
      description:
        "Filesystem extension is enabled but no workspace paths are configured",
      setupSteps: [
        "Open Claude Desktop application",
        "Go to Settings → Extensions → Filesystem",
        `Add workspace directory: ${projectPath}`,
        "Restart Claude Desktop",
      ],
    });
  } else {
    // Check if current project path is included
    const projectIncluded = serverAnalysis.workspacePaths.some(
      (workspacePath) =>
        projectPath.startsWith(workspacePath) ||
        workspacePath.startsWith(projectPath)
    );

    if (!projectIncluded) {
      recommendations.push({
        type: "PROJECT_PATH_NOT_INCLUDED",
        priority: "high",
        title: "Current Project Not in Workspace",
        description:
          "Your current project directory is not included in Claude's filesystem access",
        setupSteps: [
          "Open Claude Desktop application",
          "Go to Settings → Extensions → Filesystem",
          `Add current project: ${projectPath}`,
          "Restart Claude Desktop",
        ],
      });
    }
  }

  if (!serverAnalysis.hasContext7) {
    recommendations.push({
      type: "MISSING_CONTEXT7",
      priority: "recommended",
      title: "Context7 Extension Enhances Documentation Access",
      description:
        "Access up-to-date documentation for libraries and frameworks",
      setupSteps: [
        "Open Claude Desktop application",
        "Go to Settings → Extensions",
        "Enable 'Context7' extension",
        "Restart Claude Desktop",
      ],
    });
  }

  if (!serverAnalysis.hasGitHub) {
    recommendations.push({
      type: "MISSING_GITHUB",
      priority: "recommended",
      title: "GitHub Integration Enables Repository Access",
      description:
        "Direct access to GitHub repositories and advanced Git operations",
      setupSteps: [
        "Open Claude Desktop application",
        "Go to Settings → Connectors",
        "Enable 'GitHub' connector",
        "Authenticate with your GitHub account",
        "Restart Claude Desktop",
      ],
    });
  }

  return recommendations;
}

/**
 * Main configuration analysis function
 * REQ-304: Parse claude_desktop_config.json to determine actual server states
 */
export async function analyzeClaudeConfiguration(
  projectPath,
  configPath = null
) {
  // Parse configuration file
  const parseResult = await parseClaudeConfig(configPath);

  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error,
      issues: parseResult.issues,
      servers: {
        servers: [],
        hasFilesystem: false,
        hasContext7: false,
        hasGitHub: false,
        workspacePaths: [],
        issues: ["CONFIG_PARSE_FAILED"],
      },
      recommendations: [
        {
          type: "CONFIG_SETUP_REQUIRED",
          priority: "critical",
          title: "Claude Configuration Setup Required",
          description: parseResult.error,
          setupSteps: [
            "Install Claude Desktop application",
            "Open Claude Desktop and complete initial setup",
            "Configure MCP servers as needed",
            "Restart Claude Desktop",
          ],
        },
      ],
    };
  }

  // Analyze server configuration
  const serverAnalysis = analyzeMcpServers(parseResult.config);

  // Generate recommendations
  const recommendations = generateSetupRecommendations(
    serverAnalysis,
    projectPath
  );

  return {
    success: true,
    error: null,
    issues: [...parseResult.issues, ...serverAnalysis.issues],
    servers: serverAnalysis,
    recommendations,
    configPath: configPath || getClaudeConfigPath(),
  };
}

// Legacy aliases removed to avoid conflicts
export async function validateConfigurationStructure(configPath = null) {
  const parseResult = await parseClaudeConfig(configPath);

  if (!parseResult.success) {
    return {
      isValid: false,
      valid: false,
      errors: [{ message: parseResult.error, type: "PARSE_ERROR" }],
    };
  }

  const config = parseResult.config;
  const errors = [];

  if (!config || typeof config !== "object") {
    errors.push({
      message: "Configuration must be an object",
      type: "INVALID_TYPE",
    });
    return {
      isValid: false,
      valid: false,
      errors,
    };
  }

  if (!config.mcpServers) {
    errors.push({
      message: "Missing mcpServers section",
      type: "MISSING_SECTION",
    });
  } else if (typeof config.mcpServers !== "object") {
    errors.push({
      message: "mcpServers must be an object",
      type: "INVALID_MCP_SERVERS",
    });
  } else {
    // Validate individual server configurations
    for (const [serverName, serverConfig] of Object.entries(
      config.mcpServers
    )) {
      if (typeof serverConfig === "string") {
        errors.push({
          server: serverName,
          issue: "invalid_structure",
          message: `Server ${serverName} has invalid structure`,
        });
      } else if (serverConfig && typeof serverConfig === "object") {
        if (!serverConfig.args || !Array.isArray(serverConfig.args)) {
          errors.push({
            server: serverName,
            issue: "missing_args",
            message: `Server ${serverName} missing args array`,
          });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    valid: errors.length === 0,
    errors,
  };
}
export async function getServerConfigurationDetails(configPath = null) {
  const parseResult = await parseClaudeConfig(configPath);

  if (!parseResult.success) {
    return {
      filesystem: {
        status: "missing",
        enabled: false,
        details: "Configuration not found or invalid",
      },
      github: {
        status: "missing",
        enabled: false,
        details: "Configuration not found or invalid",
      },
      memory: {
        status: "missing",
        enabled: false,
        details: "Configuration not found or invalid",
      },
      supabase: {
        status: "missing",
        enabled: false,
        details: "Configuration not found or invalid",
      },
    };
  }

  const serverAnalysis = analyzeMcpServers(parseResult.config);

  return {
    totalServers: (serverAnalysis.servers || []).length,
    enabledFeatures: {
      filesystem: serverAnalysis.hasFilesystem || false,
      context7: serverAnalysis.hasContext7 || false,
      github: serverAnalysis.hasGitHub || false,
    },
    filesystem: {
      status: serverAnalysis.hasFilesystem || false ? "configured" : "missing",
      enabled: serverAnalysis.hasFilesystem || false,
      workspacePaths: serverAnalysis.workspacePaths || [],
      details: serverAnalysis.hasFilesystem
        ? "Filesystem server is active"
        : "Filesystem server not configured",
    },
    github: {
      status: serverAnalysis.hasGitHub || false ? "configured" : "missing",
      enabled: serverAnalysis.hasGitHub || false,
      details: serverAnalysis.hasGitHub
        ? "GitHub server is active"
        : "GitHub server not configured",
    },
    memory: {
      status: (serverAnalysis.servers || []).some((s) =>
        s.toLowerCase().includes("memory")
      )
        ? "configured"
        : "missing",
      enabled: (serverAnalysis.servers || []).some((s) =>
        s.toLowerCase().includes("memory")
      ),
      details: (serverAnalysis.servers || []).some((s) =>
        s.toLowerCase().includes("memory")
      )
        ? "Memory server is active"
        : "Memory server not configured",
    },
    supabase: {
      status: (serverAnalysis.servers || []).some((s) =>
        s.toLowerCase().includes("supabase")
      )
        ? "configured"
        : "missing",
      enabled: (serverAnalysis.servers || []).some((s) =>
        s.toLowerCase().includes("supabase")
      ),
      details: (serverAnalysis.servers || []).some((s) =>
        s.toLowerCase().includes("supabase")
      )
        ? "Supabase server is active"
        : "Supabase server not configured",
    },
    workspacePaths: serverAnalysis.workspacePaths || [],
    issues: serverAnalysis.issues || [],
  };
}

/**
 * Main configuration analysis function
 * REQ-304: Parse claude_desktop_config.json to determine actual server states
 */
export async function analyzeConfiguration(configPath = null) {
  const parseResult = await parseClaudeConfig(configPath);

  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.includes("JSON syntax error")
        ? parseResult.error.replace(
            "JSON syntax error",
            "Configuration file is malformed"
          )
        : parseResult.error,
      servers: {},
      fallbackMode: true,
    };
  }

  const serverAnalysis = analyzeMcpServers(parseResult.config);

  return {
    success: true,
    error: null,
    servers: {
      filesystem: {
        configured: serverAnalysis.hasFilesystem,
        workspacePath: serverAnalysis.workspacePaths[0] || null,
        command: serverAnalysis.hasFilesystem ? "npx" : null,
        enabled: serverAnalysis.hasFilesystem,
        type: "built-in",
        settingsPath: "Extensions",
      },
      github: {
        configured: serverAnalysis.hasGitHub,
        enabled: serverAnalysis.hasGitHub,
        type: "built-in",
        settingsPath: "Connectors",
      },
      memory: {
        configured:
          serverAnalysis.servers.includes("memory") ||
          serverAnalysis.servers.some((s) =>
            s.toLowerCase().includes("memory")
          ),
        enabled:
          serverAnalysis.servers.includes("memory") ||
          serverAnalysis.servers.some((s) =>
            s.toLowerCase().includes("memory")
          ),
        type: "mcp-server",
      },
      supabase: {
        configured:
          serverAnalysis.servers.includes("supabase") ||
          serverAnalysis.servers.some((s) =>
            s.toLowerCase().includes("supabase")
          ),
        enabled:
          serverAnalysis.servers.includes("supabase") ||
          serverAnalysis.servers.some((s) =>
            s.toLowerCase().includes("supabase")
          ),
        type: "mcp-server",
      },
    },
    workspacePaths: serverAnalysis.workspacePaths,
    issues: serverAnalysis.issues,
  };
}

/**
 * Parse Claude desktop configuration (alias for parseClaudeConfig)
 */
export const parseClaudeDesktopConfig = parseClaudeConfig;

/**
 * Detect filesystem server configuration
 * REQ-304: Check for mandatory Filesystem access and workspace path configuration
 */
export async function detectFilesystemServer(configPath = null) {
  const parseResult = await parseClaudeConfig(configPath);

  if (!parseResult.success) {
    return {
      enabled: false,
      configured: false,
      reason: "config_not_found",
      setupGuidance: [
        "Install Claude Desktop application",
        "Configure filesystem server in settings",
        "Add your workspace directories",
      ],
    };
  }

  const serverAnalysis = analyzeMcpServers(parseResult.config);

  if (serverAnalysis.hasFilesystem) {
    return {
      enabled: true,
      configured: true,
      workspacePath: serverAnalysis.workspacePaths[0] || "/workspace",
      command: "npx",
      args: ["@modelcontextprotocol/server-filesystem"],
      setupGuidance: ["Filesystem server is properly configured"],
    };
  }

  return {
    enabled: false,
    configured: false,
    reason: "not_found",
    setupGuidance:
      "Open Claude Desktop settings, enable filesystem extension, add your project directories to allowed paths",
  };
}

/**
 * Identify missing recommended extensions
 * REQ-304: Identify missing recommended extensions with specific setup guidance
 */
export async function identifyMissingExtensions(configPath = null) {
  const parseResult = await parseClaudeConfig(configPath);

  if (!parseResult.success) {
    return {
      context7: {
        missing: true,
        priority: "recommended",
        setupGuidance: ["Install Context7 MCP server"],
      },
      github: {
        missing: true,
        priority: "recommended",
        setupGuidance: ["Install GitHub MCP server"],
      },
    };
  }

  const serverAnalysis = analyzeMcpServers(parseResult.config);

  return {
    context7: {
      missing: !serverAnalysis.hasContext7,
      priority: "recommended",
      setupGuidance: serverAnalysis.hasContext7
        ? "Context7 is configured"
        : "Install Context7 MCP server for enhanced documentation access",
    },
    github: {
      missing: !serverAnalysis.hasGitHub,
      priority: "recommended",
      setupGuidance: serverAnalysis.hasGitHub
        ? "GitHub integration is configured"
        : "Install GitHub MCP server for repository integration",
    },
  };
}

/**
 * Handle malformed configuration files
 * REQ-309: Recover from JSON parsing errors with helpful messages
 */
export async function handleMalformedConfig(configPath = null) {
  const parseResult = await parseClaudeConfig(configPath);

  return {
    success: false,
    error: parseResult.error,
    recovered: true,
    originalError: parseResult.error,
    recoverySuggestions: [
      "Check JSON syntax for missing commas or brackets",
      "Validate configuration structure",
      "Use Claude desktop settings UI instead of manual editing",
    ],
    fallbackConfig: {
      mcpServers: {},
    },
    degradedMode: true,
    fallbackGuidance: "Consider manual setup if automated configuration fails",
  };
}

export default analyzeClaudeConfiguration;
