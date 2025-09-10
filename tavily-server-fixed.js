#!/usr/bin/env node
// Tavily MCP Server - Fixed Implementation
const readline = require("readline");
const https = require("https");

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

// Create readline interface for stdin/stdout communication
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

// Helper to send JSON-RPC response
function sendResponse(id, result, error = null) {
  const response = {
    jsonrpc: "2.0",
    id: id,
  };

  if (error) {
    response.error = error;
  } else {
    response.result = result;
  }

  console.log(JSON.stringify(response));
}

// Tavily search function
async function searchTavily(query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      api_key: TAVILY_API_KEY,
      query: query,
      max_results: 5,
      include_answer: true,
    });

    const options = {
      hostname: "api.tavily.com",
      path: "/search",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
      },
    };

    const req = https.request(options, (res) => {
      let result = "";
      res.on("data", (chunk) => (result += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(result));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

// Handle incoming messages
rl.on("line", async (line) => {
  try {
    const message = JSON.parse(line);

    // Handle initialize request
    if (message.method === "initialize") {
      sendResponse(message.id, {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "tavily-search",
          version: "1.0.0",
        },
      });
      return;
    }

    // Handle tools/list request
    if (message.method === "tools/list") {
      sendResponse(message.id, {
        tools: [
          {
            name: "tavily_search",
            description: "Search the web using Tavily AI-optimized search",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query",
                },
              },
              required: ["query"],
            },
          },
        ],
      });
      return;
    }

    // Handle tools/call request
    if (message.method === "tools/call") {
      const { name, arguments: args } = message.params;

      if (name === "tavily_search") {
        try {
          const results = await searchTavily(args.query);

          // Format results for MCP
          let responseText = "";

          // Add direct answer if available
          if (results.answer) {
            responseText = results.answer + "\\n\\n";
          }

          // Add search results
          if (results.results && results.results.length > 0) {
            responseText += "Search Results:\\n\\n";
            results.results.forEach((r, i) => {
              responseText += `${i + 1}. **${r.title}**\n`;
              responseText += `   ${r.content}\n`;
              responseText += `   Source: ${r.url}\n\n`;
            });
          }

          sendResponse(message.id, {
            content: [
              {
                type: "text",
                text: responseText || "No results found",
              },
            ],
          });
        } catch (error) {
          sendResponse(message.id, null, {
            code: -32603,
            message: "Search failed: " + error.message,
          });
        }
      } else {
        sendResponse(message.id, null, {
          code: -32601,
          message: "Unknown tool: " + name,
        });
      }
      return;
    }

    // Handle prompts/list (not implemented)
    if (message.method === "prompts/list") {
      sendResponse(message.id, null, {
        code: -32601,
        message: "Method not found",
      });
      return;
    }

    // Handle resources/list (not implemented)
    if (message.method === "resources/list") {
      sendResponse(message.id, null, {
        code: -32601,
        message: "Method not found",
      });
      return;
    }

    // Handle notifications (no response needed)
    if (message.method && message.method.startsWith("notifications/")) {
      // Don't respond to notifications
      return;
    }

    // Unknown method
    if (message.id !== undefined) {
      sendResponse(message.id, null, {
        code: -32601,
        message: "Method not found: " + (message.method || "unknown"),
      });
    }
  } catch (error) {
    // If we can't parse the message, log to stderr
    console.error("Parse error:", error.message);
  }
});

// Log startup to stderr
console.error("Tavily MCP Server started");

// Handle process termination
process.on("SIGINT", () => {
  process.exit(0);
});
