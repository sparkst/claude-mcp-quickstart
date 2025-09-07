# MCP Quickstart by Sparkry.AI 🚀

Transform Claude Desktop into a powerhouse AI assistant in 60 seconds. One command, zero complexity.

[![NPM Version](https://img.shields.io/npm/v/mcp-quickstart.svg)](https://www.npmjs.com/package/mcp-quickstart)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Made by Sparkry.AI](https://img.shields.io/badge/Made%20by-Sparkry.AI-ff6b6b)](https://www.sparkry.ai)

## 🎯 What is MCP Quickstart?

MCP (Model Context Protocol) Quickstart is the fastest way to unlock Claude Desktop's hidden superpowers. With one command, you give Claude the ability to:

- 📁 **Read & write files** on your computer
- 🔍 **Search the web** with Brave and Tavily
- 🐙 **Manage GitHub** repositories  
- 🧠 **Remember context** across conversations
- 🛠️ **Execute code** and automate tasks

No configuration files. No manual setup. Just pure magic.

## 🚀 Installation (60 Seconds)

```bash
npx mcp-quickstart
```

That's it. Follow the interactive wizard, and you're done.

## 🎭 The Experience

### First Run
```
╔════════════════════════════════════════╗
║         MCP Quickstart Setup           ║
║         First Time Setup Wizard        ║
╚════════════════════════════════════════╝

Welcome! Let's set up your AI-powered Claude Desktop.
This takes about 60 seconds.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: Search Services (Optional)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Brave Search (Private, no tracking)
   Get free API key: https://api.search.brave.com/app/keys
   (2,000 free searches/month)

Brave API Key (press Enter to skip): [PASTE KEY OR SKIP]
```

### Returning User
```
📍 Brave Search (Private, no tracking)
   Get free API key: https://api.search.brave.com/app/keys
   (2,000 free searches/month)

Brave API Key [Current: sk-Bv...3aF] (Enter to keep, or paste new): [ENTER]
→ Keeping existing Brave Search configuration
```

## 🎁 What You Get

### Core Features (Always Enabled)
- **📂 Filesystem Access** - Claude can read, write, and manage files in your workspace
- **🧠 Persistent Memory** - Claude remembers important context across conversations
- **📊 Data Processing** - Analyze CSVs, JSON, and other data formats

### Optional Superpowers (With API Keys)
- **🔍 Brave Search** - Private web search (2,000 free searches/month)
- **🎯 Tavily Search** - AI-optimized research (1,000 free searches/month)  
- **🐙 GitHub Integration** - Manage repos, create issues, review PRs

## 🧪 Test Your Setup

After installation, tell Claude:

```
Show me what MCP tools I have
```

Claude will display all available capabilities and provide test commands.

## 📸 Real Examples

### Web Research
```
User: Search for the latest developments in quantum computing

Claude: I'll search for the latest quantum computing developments.
[Uses Brave Search to find current information]
[Returns summarized findings with sources]
```

### File Management
```
User: Create a Python script that analyzes sales data

Claude: I'll create that Python script for you.
[Creates analyze_sales.py in your workspace]
[Writes complete, functional code]
```

### GitHub Workflow
```
User: What issues are open in my main repository?

Claude: Let me check your GitHub issues.
[Lists all open issues with details]
[Can create, update, or close issues]
```

## 🔧 Advanced Features

### Update Services Anytime
```bash
npx mcp-quickstart setup
```

### Verify Installation
```bash
npx mcp-quickstart verify
```

### Check Configuration
Your configuration lives at:
- **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

## 🆘 Troubleshooting

### Claude doesn't see the tools?
1. Restart Claude Desktop after installation
2. Run `npx mcp-quickstart verify` to check setup
3. Try the command: "Show me what MCP tools I have"

### API Key Issues?
- Re-run `npx mcp-quickstart setup` to update keys
- Existing keys are preserved (shown as `sk-Bv...3aF`)
- Press Enter to keep, or paste new to update

### Need to start fresh?
```bash
rm -rf ~/.mcp-servers
rm ~/Library/Application\ Support/Claude/claude_desktop_config.json
npx mcp-quickstart
```

## 🏢 About Sparkry.AI

[Sparkry.AI](https://www.sparkry.ai) builds tools that make AI accessible and powerful for everyone. We believe AI should augment human capability, not complicate it.

**MCP Quickstart** embodies our philosophy: powerful technology should be simple to use.

## 🤝 Contributing

We love contributions! Whether it's:
- 🐛 Bug reports
- 💡 Feature requests
- 📖 Documentation improvements
- 🔧 Code contributions

Visit our [GitHub Issues](https://github.com/sparkst/mcp-quickstart/issues) to get started.

## 📜 License

MIT © [Sparkry.AI](https://www.sparkry.ai)

---

<div align="center">
  
**Built with ❤️ by [Sparkry.AI](https://www.sparkry.ai)**

[Website](https://www.sparkry.ai) • [GitHub](https://github.com/sparkst) • [Twitter](https://twitter.com/sparkryai)

</div>
