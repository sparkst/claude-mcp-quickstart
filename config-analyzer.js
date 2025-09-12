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
      };
    }

    let config;
    try {
      config = JSON.parse(content);
    } catch (parseError) {
      return {
        success: false,
        error: `Malformed JSON: ${parseError.message}`,
        config: null,
        issues: ["MALFORMED_JSON"],
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

    return {
      success: true,
      error: null,
      config,
      issues: [],
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        success: false,
        error: "Configuration file not found",
        config: null,
        issues: ["FILE_NOT_FOUND"],
      };
    } else if (error.code === "EACCES") {
      return {
        success: false,
        error: "Cannot read configuration file - permission denied",
        config: null,
        issues: ["PERMISSION_DENIED"],
      };
    } else {
      return {
        success: false,
        error: `Configuration read error: ${error.message}`,
        config: null,
        issues: ["READ_ERROR"],
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

// Aliases for test compatibility
export const analyzeConfiguration = analyzeClaudeConfiguration;
export const parseClaudeDesktopConfig = parseClaudeConfig;
export const detectFilesystemServer = (config) => {
  const analysis = analyzeMcpServers(config);
  return {
    enabled: analysis.hasFilesystem,
    workspacePaths: analysis.workspacePaths,
    issues: analysis.issues.filter(i => i.includes('FILESYSTEM'))
  };
};
export const identifyMissingExtensions = (serverAnalysis, projectPath) => {
  const recommendations = generateSetupRecommendations(serverAnalysis, projectPath);
  return recommendations.filter(r => r.type.includes('MISSING'));
};
export const handleMalformedConfig = (error) => {
  return {
    success: false,
    error: `Configuration file error: ${error.message}`,
    recovery: "Please check your claude_desktop_config.json file for syntax errors"
  };
};
export const validateConfigurationStructure = (config) => {
  if (!config || typeof config !== 'object') {
    return { valid: false, error: "Configuration must be an object" };
  }
  if (!config.mcpServers) {
    return { valid: false, error: "Missing mcpServers section" };
  }
  return { valid: true };
};
export const getServerConfigurationDetails = (serverAnalysis) => {
  return {
    totalServers: serverAnalysis.servers.length,
    enabledFeatures: {
      filesystem: serverAnalysis.hasFilesystem,
      context7: serverAnalysis.hasContext7,
      github: serverAnalysis.hasGitHub,
    },
    workspacePaths: serverAnalysis.workspacePaths,
    issues: serverAnalysis.issues
  };
};

export default analyzeClaudeConfiguration;
