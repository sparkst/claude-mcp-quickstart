# Install MCP Quickstart for Windows PowerShell
# One-line installer for Windows users

# Check if running as admin
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires Administrator privileges." -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host @"
╔═══════════════════════════════════════════════════════╗
║           MCP QUICKSTART v1.0 - WINDOWS              ║
║       Claude Desktop + MCP Servers Setup             ║
║            Zero Config. Pure Magic.                  ║
╚═══════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Set up paths
$ClaudeConfigDir = "$env:APPDATA\Claude"
$ProjectDir = "$env:USERPROFILE\claude-mcp-workspace"
$MCPDir = "$env:USERPROFILE\.mcp-servers"

# Create directories
New-Item -ItemType Directory -Force -Path $ClaudeConfigDir | Out-Null
New-Item -ItemType Directory -Force -Path $ProjectDir | Out-Null
New-Item -ItemType Directory -Force -Path $MCPDir | Out-Null

Write-Host "→ Created directories" -ForegroundColor Green

# Check for Node.js
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "→ Installing Node.js..." -ForegroundColor Yellow
    
    # Download Node.js installer
    $nodeUrl = "https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi"
    $nodeInstaller = "$env:TEMP\node-installer.msi"
    
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
    Start-Process msiexec.exe -Wait -ArgumentList "/i $nodeInstaller /quiet /norestart"
    
    # Add to PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    Write-Host "✓ Node.js installed" -ForegroundColor Green
}

# Check for Git
try {
    $gitVersion = git --version 2>$null
    Write-Host "✓ Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "→ Installing Git..." -ForegroundColor Yellow
    winget install --id Git.Git -e --silent
    Write-Host "✓ Git installed" -ForegroundColor Green
}

# Install MCP servers
Write-Host "→ Installing MCP servers..." -ForegroundColor Blue

Set-Location $MCPDir

# Initialize npm project
if (-not (Test-Path "package.json")) {
    npm init -y 2>$null | Out-Null
}

# Install servers
$servers = @(
    @{Name="Filesystem"; Package="@modelcontextprotocol/server-filesystem"},
    @{Name="GitHub"; Package="@modelcontextprotocol/server-github"},
    @{Name="Brave Search"; Package="@modelcontextprotocol/server-brave-search"},
    @{Name="Memory"; Package="@modelcontextprotocol/server-memory"},
    @{Name="Puppeteer"; Package="@modelcontextprotocol/server-puppeteer"}
)

$installed = @()
foreach ($server in $servers) {
    Write-Host "  Installing $($server.Name)..." -ForegroundColor Yellow
    npm install $server.Package --silent 2>$null
    if ($LASTEXITCODE -eq 0) {
        $installed += $server.Name.ToLower() -replace ' ', '-'
        Write-Host "  ✓ $($server.Name) installed" -ForegroundColor Green
    }
}

# Auto-detect API keys
$githubToken = $env:GITHUB_TOKEN
if (-not $githubToken) {
    $githubToken = git config --global github.token 2>$null
}
if (-not $githubToken) {
    $githubToken = "PLACEHOLDER_GITHUB_TOKEN"
}

$braveKey = $env:BRAVE_API_KEY
if (-not $braveKey) {
    $braveKey = "PLACEHOLDER_BRAVE_KEY"
}

# Generate Claude config
Write-Host "→ Generating Claude configuration..." -ForegroundColor Blue

$config = @{
    mcpServers = @{
        filesystem = @{
            command = "node"
            args = @(
                "$MCPDir\node_modules\@modelcontextprotocol\server-filesystem\dist\index.js",
                $ProjectDir
            )
            env = @{}
        }
        github = @{
            command = "npx"
            args = @("-y", "@modelcontextprotocol/server-github")
            env = @{
                GITHUB_PERSONAL_ACCESS_TOKEN = $githubToken
            }
        }
        "brave-search" = @{
            command = "npx"
            args = @("-y", "@modelcontextprotocol/server-brave-search")
            env = @{
                BRAVE_API_KEY = $braveKey
            }
        }
        memory = @{
            command = "node"
            args = @(
                "$MCPDir\node_modules\@modelcontextprotocol\server-memory\dist\index.js"
            )
            env = @{}
        }
    }
}

$configJson = $config | ConvertTo-Json -Depth 10
Set-Content -Path "$ClaudeConfigDir\claude_desktop_config.json" -Value $configJson

Write-Host "✓ Configuration written" -ForegroundColor Green

# Create update script
$updateScript = @"
Write-Host 'MCP API Key Updater' -ForegroundColor Cyan
Write-Host '==================='

`$configFile = "$ClaudeConfigDir\claude_desktop_config.json"
`$config = Get-Content `$configFile | ConvertFrom-Json

`$githubToken = Read-Host -Prompt 'Enter GitHub Token (or press Enter to skip)'
if (`$githubToken) {
    `$config.mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN = `$githubToken
    Write-Host '✓ GitHub token updated' -ForegroundColor Green
}

`$braveKey = Read-Host -Prompt 'Enter Brave API Key (or press Enter to skip)'
if (`$braveKey) {
    `$config.mcpServers.'brave-search'.env.BRAVE_API_KEY = `$braveKey
    Write-Host '✓ Brave API key updated' -ForegroundColor Green
}

`$config | ConvertTo-Json -Depth 10 | Set-Content `$configFile
Write-Host 'Configuration updated! Please restart Claude Desktop.' -ForegroundColor Green
pause
"@

Set-Content -Path "$env:USERPROFILE\update-mcp-keys.ps1" -Value $updateScript

# Create test file
$testContent = @"
# MCP Test Commands

Test your setup with these commands in Claude:

1. List files in workspace
2. Search for "AI news"
3. Remember: "Setup complete"
4. Show GitHub repos

All should work without errors!
"@

Set-Content -Path "$ProjectDir\test-mcp.md" -Value $testContent

# Success message
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║            🎉 SETUP COMPLETE! 🎉                      ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: " -NoNewline
Write-Host ".\update-mcp-keys.ps1" -ForegroundColor Yellow -NoNewline
Write-Host " to add API keys"
Write-Host "2. Restart Claude Desktop" -ForegroundColor Yellow
Write-Host "3. Test with: 'Show me my MCP capabilities'" -ForegroundColor Yellow
Write-Host ""
Write-Host "Workspace: $ProjectDir" -ForegroundColor Green
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Cyan
