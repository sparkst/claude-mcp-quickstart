#!/usr/bin/env python3
"""
MCP Quickstart - Advanced Setup with Auto-Configuration
Handles complex scenarios and enterprise setups
"""

import os
import sys
import json
import subprocess
import platform
import shutil
from pathlib import Path
import requests
import argparse
from typing import Dict, List, Optional
import hashlib
import re

class MCPQuickstart:
    def __init__(self, verbose=False, auto_yes=False):
        self.verbose = verbose
        self.auto_yes = auto_yes
        self.os_type = platform.system()
        self.home = Path.home()
        self.errors = []
        self.warnings = []
        
        # Determine Claude config path
        if self.os_type == "Darwin":
            self.claude_config_dir = self.home / "Library" / "Application Support" / "Claude"
        elif self.os_type == "Windows":
            self.claude_config_dir = Path(os.environ["APPDATA"]) / "Claude"
        else:
            self.claude_config_dir = self.home / ".config" / "claude"
    
    def log(self, message, level="INFO"):
        """Unified logging"""
        colors = {
            "INFO": "\033[0;34m",
            "SUCCESS": "\033[0;32m", 
            "WARNING": "\033[1;33m",
            "ERROR": "\033[0;31m"
        }
        reset = "\033[0m"
        
        if level == "ERROR":
            self.errors.append(message)
        elif level == "WARNING":
            self.warnings.append(message)
            
        print(f"{colors.get(level, '')}[{level}] {message}{reset}")
    
    def run_command(self, cmd, shell=True, capture=True):
        """Run shell command with error handling"""
        try:
            result = subprocess.run(
                cmd, 
                shell=shell, 
                capture_output=capture, 
                text=True,
                timeout=30
            )
            if result.returncode != 0 and self.verbose:
                self.log(f"Command failed: {result.stderr}", "WARNING")
            return result.returncode == 0, result.stdout
        except Exception as e:
            self.log(f"Command execution failed: {e}", "ERROR")
            return False, ""
    
    def check_dependencies(self):
        """Check and install missing dependencies"""
        deps = {
            "node": {
                "check": "node --version",
                "install_mac": "brew install node",
                "install_linux": "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs",
                "install_windows": "winget install OpenJS.NodeJS"
            },
            "git": {
                "check": "git --version",
                "install_mac": "brew install git",
                "install_linux": "sudo apt-get install -y git",
                "install_windows": "winget install Git.Git"
            }
        }
        
        for dep, cmds in deps.items():
            success, _ = self.run_command(cmds["check"])
            if not success:
                self.log(f"Installing {dep}...", "WARNING")
                install_cmd = cmds.get(f"install_{self.os_type.lower()}", "")
                if install_cmd:
                    self.run_command(install_cmd)
    
    def auto_detect_projects(self):
        """Auto-detect existing projects and repositories"""
        projects = []
        
        # Common project locations
        search_paths = [
            self.home / "Documents",
            self.home / "Projects", 
            self.home / "Developer",
            self.home / "dev",
            self.home / "workspace"
        ]
        
        for path in search_paths:
            if path.exists():
                # Look for git repos
                for item in path.iterdir():
                    if item.is_dir() and (item / ".git").exists():
                        projects.append(str(item))
        
        return projects[:5]  # Limit to 5 projects
    
    def detect_api_keys(self):
        """Auto-detect API keys from various sources"""
        keys = {
            "github_token": None,
            "brave_key": None,
            "openai_key": None,
            "anthropic_key": None
        }
        
        # Check environment variables
        env_mappings = {
            "github_token": ["GITHUB_TOKEN", "GH_TOKEN", "GITHUB_PERSONAL_ACCESS_TOKEN"],
            "brave_key": ["BRAVE_API_KEY", "BRAVE_SEARCH_KEY"],
            "openai_key": ["OPENAI_API_KEY"],
            "anthropic_key": ["ANTHROPIC_API_KEY", "CLAUDE_API_KEY"]
        }
        
        for key, env_vars in env_mappings.items():
            for env_var in env_vars:
                if os.environ.get(env_var):
                    keys[key] = os.environ[env_var]
                    break
        
        # Check git config for GitHub token
        if not keys["github_token"]:
            success, token = self.run_command("git config --global github.token")
            if success and token.strip():
                keys["github_token"] = token.strip()
        
        # Check common config files
        config_files = [
            self.home / ".bashrc",
            self.home / ".zshrc", 
            self.home / ".env",
            self.home / ".config" / "gh" / "hosts.yml"
        ]
        
        for config_file in config_files:
            if config_file.exists():
                try:
                    content = config_file.read_text()
                    # Simple regex patterns for common key formats
                    patterns = {
                        "github_token": r"(?:GITHUB_TOKEN|GH_TOKEN)=([^\s\n]+)",
                        "brave_key": r"BRAVE_API_KEY=([^\s\n]+)",
                        "openai_key": r"OPENAI_API_KEY=([^\s\n]+)"
                    }
                    
                    for key, pattern in patterns.items():
                        if not keys[key]:
                            match = re.search(pattern, content)
                            if match:
                                keys[key] = match.group(1).strip('"\'')
                except:
                    pass
        
        return keys
    
    def install_mcp_servers(self):
        """Install all MCP servers with progress tracking"""
        mcp_dir = self.home / ".mcp-servers"
        mcp_dir.mkdir(exist_ok=True)
        
        servers = [
            {
                "name": "filesystem",
                "package": "@modelcontextprotocol/server-filesystem",
                "required": True
            },
            {
                "name": "github",
                "package": "@modelcontextprotocol/server-github",
                "required": True
            },
            {
                "name": "brave-search",
                "package": "@modelcontextprotocol/server-brave-search",
                "required": True
            },
            {
                "name": "memory",
                "package": "@modelcontextprotocol/server-memory",
                "required": True
            },
            {
                "name": "puppeteer",
                "package": "@modelcontextprotocol/server-puppeteer",
                "required": False
            },
            {
                "name": "sqlite",
                "package": "@modelcontextprotocol/server-sqlite",
                "required": False
            }
        ]
        
        os.chdir(mcp_dir)
        
        # Initialize package.json if not exists
        if not (mcp_dir / "package.json").exists():
            self.run_command("npm init -y")
        
        installed = []
        for i, server in enumerate(servers, 1):
            self.log(f"Installing {server['name']} [{i}/{len(servers)}]...")
            success, _ = self.run_command(f"npm install {server['package']} --silent")
            
            if success:
                installed.append(server['name'])
                self.log(f"✓ {server['name']} installed", "SUCCESS")
            elif server['required']:
                self.log(f"Failed to install required server: {server['name']}", "ERROR")
            else:
                self.log(f"Optional server {server['name']} skipped", "WARNING")
        
        return installed, mcp_dir
    
    def generate_claude_config(self, installed_servers, mcp_dir, projects, api_keys):
        """Generate optimized Claude configuration"""
        config = {"mcpServers": {}}
        
        # Base configurations for each server
        server_configs = {
            "filesystem": {
                "command": "node",
                "args": [
                    str(mcp_dir / "node_modules" / "@modelcontextprotocol" / "server-filesystem" / "dist" / "index.js"),
                    str(self.home / "claude-mcp-workspace")
                ],
                "env": {}
            },
            "github": {
                "command": "npx",
                "args": ["-y", "@modelcontextprotocol/server-github"],
                "env": {
                    "GITHUB_PERSONAL_ACCESS_TOKEN": api_keys.get("github_token", "PLACEHOLDER_GITHUB_TOKEN")
                }
            },
            "brave-search": {
                "command": "npx",
                "args": ["-y", "@modelcontextprotocol/server-brave-search"],
                "env": {
                    "BRAVE_API_KEY": api_keys.get("brave_key", "PLACEHOLDER_BRAVE_KEY")
                }
            },
            "memory": {
                "command": "node",
                "args": [
                    str(mcp_dir / "node_modules" / "@modelcontextprotocol" / "server-memory" / "dist" / "index.js")
                ],
                "env": {}
            },
            "sqlite": {
                "command": "node",
                "args": [
                    str(mcp_dir / "node_modules" / "@modelcontextprotocol" / "server-sqlite" / "dist" / "index.js"),
                    str(self.home / "claude-mcp-workspace" / "data.db")
                ],
                "env": {}
            }
        }
        
        # Add installed servers to config
        for server in installed_servers:
            if server in server_configs:
                config["mcpServers"][server] = server_configs[server]
        
        # Add multiple filesystem servers for different projects
        if projects and "filesystem" in installed_servers:
            for i, project in enumerate(projects[:3], 1):  # Limit to 3 projects
                project_name = Path(project).name
                config["mcpServers"][f"project-{project_name}"] = {
                    "command": "node",
                    "args": [
                        str(mcp_dir / "node_modules" / "@modelcontextprotocol" / "server-filesystem" / "dist" / "index.js"),
                        project
                    ],
                    "env": {}
                }
        
        return config
    
    def create_helper_scripts(self):
        """Create helper scripts and documentation"""
        workspace = self.home / "claude-mcp-workspace"
        workspace.mkdir(exist_ok=True)
        
        # Create test script
        test_script = workspace / "test-mcp.md"
        test_script.write_text("""# MCP Test Suite

## Run these tests in Claude to verify your setup:

### 1. Filesystem Test
```
List all files in my workspace
```

### 2. GitHub Test
```
Show my recent GitHub activity
```

### 3. Search Test
```
Search for "latest AI news"
```

### 4. Memory Test
```
Remember this: "MCP setup completed successfully"
Then ask: "What did I just ask you to remember?"
```

### 5. Combined Test
```
Create a new file called test.py with a hello world function, 
then commit it to a new GitHub repo
```

## Expected Results:
- ✅ Each command should execute without errors
- ✅ You should see actual results (files, search results, etc.)
- ✅ Memory should persist across messages

## Troubleshooting:
If any test fails:
1. Restart Claude Desktop
2. Check the config file exists
3. Verify API keys are set correctly
""")
        
        # Create project template
        template_dir = workspace / "project-template"
        template_dir.mkdir(exist_ok=True)
        
        (template_dir / "README.md").write_text("""# New Project

Created with MCP Quickstart

## Features
- [ ] Core functionality
- [ ] Tests
- [ ] Documentation

## Getting Started
Ask Claude to help you build this project!
""")
        
        (template_dir / ".gitignore").write_text("""node_modules/
.env
*.log
.DS_Store
dist/
build/
""")
        
        self.log(f"Helper scripts created in {workspace}", "SUCCESS")
    
    def backup_existing_config(self):
        """Backup existing Claude configuration if it exists"""
        config_file = self.claude_config_dir / "claude_desktop_config.json"
        
        if config_file.exists():
            backup_file = config_file.with_suffix(f".backup.{int(hashlib.md5(str(config_file).encode()).hexdigest()[:8], 16)}")
            shutil.copy2(config_file, backup_file)
            self.log(f"Backed up existing config to {backup_file.name}", "INFO")
            return backup_file
        return None
    
    def run(self):
        """Main installation flow"""
        print("""
╔═══════════════════════════════════════════════════════╗
║           MCP QUICKSTART - ADVANCED SETUP             ║
║                  Zero to Hero Mode                    ║
╚═══════════════════════════════════════════════════════╝
        """)
        
        # Step 1: Check dependencies
        self.log("Checking dependencies...")
        self.check_dependencies()
        
        # Step 2: Auto-detect projects
        self.log("Scanning for existing projects...")
        projects = self.auto_detect_projects()
        if projects:
            self.log(f"Found {len(projects)} existing projects", "SUCCESS")
        
        # Step 3: Auto-detect API keys
        self.log("Detecting API keys...")
        api_keys = self.detect_api_keys()
        keys_found = sum(1 for v in api_keys.values() if v)
        self.log(f"Found {keys_found} API keys", "SUCCESS" if keys_found else "WARNING")
        
        # Step 4: Backup existing config
        self.backup_existing_config()
        
        # Step 5: Install MCP servers
        self.log("Installing MCP servers...")
        installed_servers, mcp_dir = self.install_mcp_servers()
        
        # Step 6: Generate configuration
        self.log("Generating Claude configuration...")
        config = self.generate_claude_config(installed_servers, mcp_dir, projects, api_keys)
        
        # Step 7: Write configuration
        self.claude_config_dir.mkdir(parents=True, exist_ok=True)
        config_file = self.claude_config_dir / "claude_desktop_config.json"
        config_file.write_text(json.dumps(config, indent=2))
        self.log(f"Configuration written to {config_file}", "SUCCESS")
        
        # Step 8: Create helper scripts
        self.create_helper_scripts()
        
        # Final report
        print("\n" + "="*50)
        print("INSTALLATION COMPLETE!")
        print("="*50)
        
        if self.errors:
            print(f"\n⚠️  {len(self.errors)} errors occurred:")
            for error in self.errors[:3]:
                print(f"  - {error}")
        
        if self.warnings:
            print(f"\n⚠️  {len(self.warnings)} warnings:")
            for warning in self.warnings[:3]:
                print(f"  - {warning}")
        
        print(f"""
✅ Installed {len(installed_servers)} MCP servers
✅ Configured {len(projects)} project workspaces
✅ Detected {keys_found} API keys
✅ Configuration saved to Claude

Next steps:
1. Restart Claude Desktop
2. Test with: "Show me my MCP capabilities"
3. Check ~/claude-mcp-workspace/test-mcp.md for tests

Happy coding! 🚀
        """)

def main():
    parser = argparse.ArgumentParser(description="MCP Quickstart - Advanced Setup")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    parser.add_argument("-y", "--yes", action="store_true", help="Auto-yes to prompts")
    parser.add_argument("--repair", action="store_true", help="Repair existing installation")
    
    args = parser.parse_args()
    
    installer = MCPQuickstart(verbose=args.verbose, auto_yes=args.yes)
    installer.run()

if __name__ == "__main__":
    main()
