import { describe, test, expect } from "vitest";

// Config validation utilities
function validateMcpConfig(config) {
  if (!config || typeof config !== "object") {
    return { valid: false, error: "Config must be an object" };
  }

  if (!config.mcpServers || typeof config.mcpServers !== "object") {
    return { valid: false, error: "Config must have mcpServers object" };
  }

  const servers = config.mcpServers;
  const requiredServers = ["filesystem", "memory"];

  for (const server of requiredServers) {
    if (!servers[server]) {
      return { valid: false, error: `Missing required server: ${server}` };
    }

    if (!servers[server].command || !Array.isArray(servers[server].args)) {
      return { valid: false, error: `Invalid server config for: ${server}` };
    }
  }

  return { valid: true };
}

function mergeConfigs(existingConfig, newServers) {
  const merged = {
    ...existingConfig,
    mcpServers: {
      ...(existingConfig.mcpServers || {}),
      ...newServers,
    },
  };
  return merged;
}

describe("validateMcpConfig", () => {
  test("validates correct config structure", () => {
    const config = {
      mcpServers: {
        filesystem: {
          command: "npx",
          args: [
            "-y",
            "@modelcontextprotocol/server-filesystem",
            "/path/to/workspace",
          ],
        },
        memory: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
      },
    };

    const result = validateMcpConfig(config);
    expect(result.valid).toBe(true);
  });

  test("rejects null config", () => {
    const result = validateMcpConfig(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Config must be an object");
  });

  test("rejects config without mcpServers", () => {
    const result = validateMcpConfig({});
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Config must have mcpServers object");
  });

  test("rejects config missing required filesystem server", () => {
    const config = {
      mcpServers: {
        memory: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
      },
    };

    const result = validateMcpConfig(config);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Missing required server: filesystem");
  });

  test("rejects config missing required memory server", () => {
    const config = {
      mcpServers: {
        filesystem: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
        },
      },
    };

    const result = validateMcpConfig(config);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Missing required server: memory");
  });

  test("rejects server config without command", () => {
    const config = {
      mcpServers: {
        filesystem: {
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
        },
        memory: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
      },
    };

    const result = validateMcpConfig(config);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid server config for: filesystem");
  });
});

describe("mergeConfigs", () => {
  test("merges new servers with existing config", () => {
    const existing = {
      mcpServers: {
        existing: { command: "test", args: [] },
      },
      otherProperty: "preserved",
    };

    const newServers = {
      filesystem: { command: "npx", args: ["-y", "fs"] },
      memory: { command: "npx", args: ["-y", "mem"] },
    };

    const merged = mergeConfigs(existing, newServers);

    expect(merged.otherProperty).toBe("preserved");
    expect(merged.mcpServers.existing).toEqual({ command: "test", args: [] });
    expect(merged.mcpServers.filesystem).toEqual({
      command: "npx",
      args: ["-y", "fs"],
    });
    expect(merged.mcpServers.memory).toEqual({
      command: "npx",
      args: ["-y", "mem"],
    });
  });

  test("creates mcpServers object if not present", () => {
    const existing = { otherProperty: "preserved" };
    const newServers = {
      filesystem: { command: "npx", args: ["-y", "fs"] },
    };

    const merged = mergeConfigs(existing, newServers);

    expect(merged.otherProperty).toBe("preserved");
    expect(merged.mcpServers.filesystem).toEqual({
      command: "npx",
      args: ["-y", "fs"],
    });
  });

  test("overwrites existing servers with same name", () => {
    const existing = {
      mcpServers: {
        filesystem: { command: "old", args: ["old"] },
      },
    };

    const newServers = {
      filesystem: { command: "new", args: ["new"] },
    };

    const merged = mergeConfigs(existing, newServers);

    expect(merged.mcpServers.filesystem).toEqual({
      command: "new",
      args: ["new"],
    });
  });
});
