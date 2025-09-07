# MCP Quickstart Deployer

Deploy this entire MCP Quickstart package to your customers with a single command.

## 🚀 Quick Deploy Options

### Option 1: NPX (Recommended)
```bash
npx create-mcp-setup
```

### Option 2: Direct Script
```bash
curl -sSL https://mcp.yourdomain.com/install | bash
```

### Option 3: GitHub Template
Click "Use this template" on GitHub to create your own copy.

## 📦 What Your Customers Get

### Instant Setup
- **60-second installation** - From zero to fully configured
- **Zero manual config** - Everything automated
- **Smart defaults** - Works out of the box
- **Auto-detection** - Finds existing projects and API keys

### Complete Package
1. **5 Essential MCP Servers**
   - Filesystem (project access)
   - GitHub (repo management)
   - Brave Search (web search)
   - Memory (persistent context)
   - Supabase (database ops)

2. **Helper Tools**
   - API key updater script
   - Test suite
   - Bootstrap prompts
   - Project templates

3. **Documentation**
   - Setup guide
   - Troubleshooting
   - Example workflows

## 🛠️ Customization for Your Business

### White-Label Setup

1. Fork this repository
2. Update branding in scripts:
```bash
# Replace banner text
sed -i 's/MCP QUICKSTART/YOUR PRODUCT NAME/g' install.sh
```

3. Add your defaults:
```javascript
// In advanced-setup.py
DEFAULT_WORKSPACE = "/path/to/your/workspace"
DEFAULT_SERVERS = ["your-custom-server", ...]
```

### Add Custom Servers

Edit `advanced-setup.py`:
```python
servers = [
    # ... existing servers ...
    {
        "name": "your-server",
        "package": "@your-org/mcp-server",
        "required": True,
        "config": {
            "api_key": "YOUR_DEFAULT_KEY"
        }
    }
]
```

### Pre-Configure for Your Stack

Create a custom config template:
```json
{
  "mcpServers": {
    "your-backend": {
      "command": "node",
      "args": ["path/to/your/server"],
      "env": {
        "API_ENDPOINT": "https://api.yourdomain.com",
        "DEFAULT_PROJECT": "starter-template"
      }
    }
  }
}
```

## 📊 Analytics & Telemetry

Add optional telemetry to track installations:

```python
# In advanced-setup.py
def send_telemetry():
    if self.telemetry_enabled:
        requests.post("https://analytics.yourdomain.com/install", json={
            "version": VERSION,
            "os": self.os_type,
            "servers": installed_servers,
            "timestamp": datetime.now().isoformat()
        })
```

## 🎯 Customer Success Playbook

### 1. Onboarding Email Template
```markdown
Subject: Your AI Development Environment is Ready! 🚀

Hi [Name],

Your Claude + MCP setup is one command away:

Mac/Linux:
curl -sSL https://setup.yourdomain.com/install | bash

Windows:
iwr -useb https://setup.yourdomain.com/install.ps1 | iex

After installation:
1. Restart Claude Desktop
2. Try: "Show me my MCP capabilities"
3. Check out the bootstrap prompts for quick wins

Questions? Reply to this email or check our docs.

Happy building!
```

### 2. Support Snippets

Common issues and solutions:

```bash
# Check installation
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Repair installation
curl -sSL https://setup.yourdomain.com/install | bash --repair

# Update servers
npm update -g @modelcontextprotocol/server-*

# Clear cache
rm -rf ~/.mcp-servers/node_modules
```

### 3. Success Metrics

Track these KPIs:
- Installation success rate
- Time to first MCP command
- Server usage patterns
- Error rates by OS

## 🔐 Security Considerations

### API Key Management
- Never hardcode production keys
- Use environment variables
- Implement key rotation
- Add encryption for stored keys

### Sandboxing
```javascript
// Limit filesystem access
"filesystem": {
  "args": [
    "--sandbox",
    "--allowed-paths=/safe/directory"
  ]
}
```

### Audit Logging
```python
def log_installation(user_id, config):
    with open('/var/log/mcp-installs.log', 'a') as f:
        f.write(f"{datetime.now()} - User: {user_id} - Config: {json.dumps(config)}\n")
```

## 🚢 Deployment Options

### 1. CDN Distribution
```nginx
# nginx.conf
location /install {
    proxy_pass https://cdn.yourdomain.com/mcp-quickstart/install.sh;
    proxy_cache_valid 200 1h;
    add_header X-Frame-Options "SAMEORIGIN";
}
```

### 2. Docker Container
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["node", "server.js"]
```

### 3. Serverless Function
```javascript
// Vercel/Netlify function
export default async function handler(req, res) {
  const script = await fetch('install.sh');
  res.setHeader('Content-Type', 'text/plain');
  res.send(script);
}
```

## 📈 Scaling Considerations

### Rate Limiting
```python
from functools import lru_cache
from time import time

@lru_cache(maxsize=1000)
def check_rate_limit(ip_address):
    # Implement rate limiting
    pass
```

### Caching Strategy
- Cache installer scripts on CDN
- Cache npm packages locally
- Pre-download common dependencies

### Multi-Region Support
```bash
# Detect region and use nearest mirror
REGION=$(curl -s https://ipapi.co/country_code)
case $REGION in
    US) MIRROR="https://us.mcp.yourdomain.com" ;;
    EU) MIRROR="https://eu.mcp.yourdomain.com" ;;
    *) MIRROR="https://global.mcp.yourdomain.com" ;;
esac
```

## 🎁 Premium Features

### Enterprise Edition
- Priority support
- Custom server development
- White-glove onboarding
- SLA guarantees

### Add-On Servers
- Database connectors
- Cloud integrations
- Industry-specific tools
- Custom AI models

## 📝 License & Distribution

This setup is MIT licensed. You can:
- ✅ Use commercially
- ✅ Modify freely
- ✅ Distribute to customers
- ✅ Create derivative works

Attribution appreciated but not required.

## 🤝 Contributing

PRs welcome! Please:
1. Test on all platforms
2. Update documentation
3. Add tests for new features
4. Follow existing code style

## 📞 Support

- Email: support@yourdomain.com
- Discord: discord.gg/yourserver
- Docs: docs.yourdomain.com/mcp

---

Ready to deploy? Your customers will love the simplicity! 🚀
