// Test utilities for MCP Quickstart
// This file provides test-specific implementations and helpers

import fs from 'fs/promises';
import { getConfigPath } from './setup.js';
import chalk from 'chalk';

// Re-implement functions for testing (mirroring internal implementations)
export function maskToken(token) {
  if (!token || token.length < 8) return token;
  return token.substring(0, 5) + '*'.repeat(token.length - 8) + token.substring(token.length - 3);
}

export async function loadExistingConfig() {
  try {
    const configPath = getConfigPath();
    const configContent = await fs.readFile(configPath, "utf8");
    
    // Safely parse JSON with proper error handling
    try {
      const config = JSON.parse(configContent);
      // Validate basic structure
      if (!config || typeof config !== 'object') {
        throw new Error('Invalid config structure');
      }
      return {
        mcpServers: config.mcpServers || {},
        ...config
      };
    } catch (parseError) {
      console.warn(chalk.yellow(`Invalid JSON in config file: ${parseError.message}`));
      return { mcpServers: {} };
    }
  } catch (error) {
    // File doesn't exist or can't be read
    return { mcpServers: {} };
  }
}

export function getExistingToken(existingConfig, serverName) {
  const server = existingConfig.mcpServers?.[serverName];
  if (!server) return null;
  
  // Handle different token storage methods
  if (server.env) {
    // Environment variable tokens
    const tokenMap = {
      github: 'GITHUB_TOKEN',
      brave: 'BRAVE_API_KEY', 
      tavily: 'TAVILY_API_KEY'
    };
    return server.env[tokenMap[serverName]] || null;
  } else if (server.args && serverName === 'supabase') {
    // Command line argument tokens (Supabase)
    const tokenArg = server.args.find(arg => arg.startsWith('--access-token='));
    return tokenArg ? tokenArg.replace('--access-token=', '') : null;
  }
  
  return null;
}

export function validateToken(token, serverType) {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // Basic validation patterns
  const patterns = {
    github: /^(gh[ps]_[a-zA-Z0-9]{36,40}|[a-f0-9]{40})$/,
    supabase: /^sb[a-z]_[a-zA-Z0-9_-]+$/,
    brave: /^[A-Z0-9]{32,}$/,
    tavily: /^tvly-[a-zA-Z0-9_-]{20,}$/
  };

  const pattern = patterns[serverType];
  return pattern ? pattern.test(token) : token.length >= 8;
}

export function validateAndMergeConfig(existingConfig, newServers) {
  // Validate existing config structure
  if (!existingConfig || typeof existingConfig !== 'object') {
    throw new Error('Invalid existing configuration');
  }

  // Ensure mcpServers exists
  if (!existingConfig.mcpServers || typeof existingConfig.mcpServers !== 'object') {
    existingConfig.mcpServers = {};
  }

  // Validate new servers
  for (const [serverName, serverConfig] of Object.entries(newServers)) {
    if (!serverConfig || typeof serverConfig !== 'object') {
      throw new Error(`Invalid configuration for server: ${serverName}`);
    }
    
    if (!serverConfig.command || !Array.isArray(serverConfig.args)) {
      throw new Error(`Invalid server configuration structure for: ${serverName}`);
    }
  }

  // Safe merge
  return {
    ...existingConfig,
    mcpServers: { ...existingConfig.mcpServers, ...newServers }
  };
}

export function withSecureToken(token, callback) {
  try {
    return callback(token);
  } finally {
    // Clear token (best effort in JavaScript)
    token = null;
    if (global.gc) {
      global.gc();
    }
  }
}

// Test-specific helpers
export function createMockConfig(servers = {}) {
  return {
    mcpServers: servers
  };
}

export function createMockServer(type, token) {
  const servers = {
    github: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: { GITHUB_TOKEN: token }
    },
    supabase: {
      command: "npx",
      args: ["-y", "@supabase/mcp-server-supabase", `--access-token=${token}`]
    },
    brave: {
      command: "npx",
      args: ["-y", "@brave/brave-search-mcp-server"],
      env: { BRAVE_API_KEY: token }
    },
    tavily: {
      command: "npx",
      args: ["-y", "tavily-mcp"],
      env: { TAVILY_API_KEY: token }
    }
  };

  return servers[type] || null;
}

export function generateTestToken(type) {
  const tokens = {
    github: "ghp_1234567890abcdef1234567890abcdef123456",
    supabase: "sbp_abcdefghijklmnopqrstuvwxyz1234567890",
    brave: "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456",
    tavily: "tvly-abcdefghijklmnopqrstuvwxyz123456"
  };

  return tokens[type] || "test-token-12345678";
}