@echo off
setlocal enabledelayedexpansion

:: MCP Quickstart for Windows
:: Zero-config automated setup for Claude Desktop + MCP Servers

cls
echo ===============================================
echo          MCP QUICKSTART v1.0 - WINDOWS
echo      Claude Desktop + MCP Servers Setup
echo           Zero Config. Pure Magic.
echo ===============================================
echo.

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script requires administrator privileges.
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

:: Set Claude config directory
set CLAUDE_CONFIG_DIR=%APPDATA%\Claude

:: Create config directory
if not exist "%CLAUDE_CONFIG_DIR%" mkdir "%CLAUDE_CONFIG_DIR%"

:: Set project directory
if not defined PROJECT_DIR (
    set PROJECT_DIR=%USERPROFILE%\claude-mcp-workspace
    echo Creating workspace at: !PROJECT_DIR!
    if not exist "!PROJECT_DIR!" mkdir "!PROJECT_DIR!"
)

:: Check for Node.js
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo Installing Node.js...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi' -OutFile '%TEMP%\node-installer.msi'}"
    msiexec /i "%TEMP%\node-installer.msi" /quiet /norestart
    set PATH=%PATH%;%ProgramFiles%\nodejs
)

echo Node.js ready

:: Check for Python
where python >nul 2>&1
if %errorLevel% neq 0 (
    echo Installing Python...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.0/python-3.11.0-amd64.exe' -OutFile '%TEMP%\python-installer.exe'}"
    "%TEMP%\python-installer.exe" /quiet InstallAllUsers=1 PrependPath=1
)

echo Python ready

:: Create MCP servers directory
set MCP_DIR=%USERPROFILE%\.mcp-servers
if not exist "%MCP_DIR%" mkdir "%MCP_DIR%"

echo Installing MCP servers...
cd /d "%MCP_DIR%"

:: Initialize npm
call npm init -y >nul 2>&1

:: Install servers
echo   [1/5] Filesystem server...
call npm install @modelcontextprotocol/server-filesystem --silent

echo   [2/5] GitHub server...
call npm install @modelcontextprotocol/server-github --silent

echo   [3/5] Brave Search server...
call npm install @modelcontextprotocol/server-brave-search --silent

echo   [4/5] Memory server...
call npm install @modelcontextprotocol/server-memory --silent

echo   [5/5] Additional tools...
call npm install @modelcontextprotocol/server-puppeteer --silent

echo All MCP servers installed!

:: Generate config
echo Generating Claude configuration...

:: Create the JSON config
(
echo {
echo   "mcpServers": {
echo     "filesystem": {
echo       "command": "node",
echo       "args": ["%MCP_DIR:\=\\%\\node_modules\\@modelcontextprotocol\\server-filesystem\\dist\\index.js", "%PROJECT_DIR:\=\\%"],
echo       "env": {}
echo     },
echo     "github": {
echo       "command": "npx",
echo       "args": ["-y", "@modelcontextprotocol/server-github"],
echo       "env": {
echo         "GITHUB_PERSONAL_ACCESS_TOKEN": "PLACEHOLDER_GITHUB_TOKEN"
echo       }
echo     },
echo     "brave-search": {
echo       "command": "npx",
echo       "args": ["-y", "@modelcontextprotocol/server-brave-search"],
echo       "env": {
echo         "BRAVE_API_KEY": "PLACEHOLDER_BRAVE_KEY"
echo       }
echo     },
echo     "memory": {
echo       "command": "node",
echo       "args": ["%MCP_DIR:\=\\%\\node_modules\\@modelcontextprotocol\\server-memory\\dist\\index.js"],
echo       "env": {}
echo     }
echo   }
echo }
) > "%CLAUDE_CONFIG_DIR%\claude_desktop_config.json"

:: Create update script
(
echo @echo off
echo echo MCP API Key Updater
echo echo ===================
echo echo.
echo set /p "github_token=Enter GitHub Token (or press Enter to skip): "
echo if not "!github_token!"=="" (
echo     powershell -Command "(Get-Content '%CLAUDE_CONFIG_DIR%\claude_desktop_config.json') -replace 'PLACEHOLDER_GITHUB_TOKEN', '!github_token!' | Set-Content '%CLAUDE_CONFIG_DIR%\claude_desktop_config.json'"
echo     echo GitHub token updated
echo )
echo.
echo set /p "brave_key=Enter Brave API Key (or press Enter to skip): "
echo if not "!brave_key!"=="" (
echo     powershell -Command "(Get-Content '%CLAUDE_CONFIG_DIR%\claude_desktop_config.json') -replace 'PLACEHOLDER_BRAVE_KEY', '!brave_key!' | Set-Content '%CLAUDE_CONFIG_DIR%\claude_desktop_config.json'"
echo     echo Brave API key updated
echo )
echo.
echo echo Configuration updated! Please restart Claude Desktop.
echo pause
) > "%USERPROFILE%\update-mcp-keys.bat"

:: Success message
cls
echo ===============================================
echo            SETUP COMPLETE!
echo ===============================================
echo.
echo Next steps:
echo 1. Run: update-mcp-keys.bat to add your API keys
echo 2. Restart Claude Desktop
echo 3. Test with: "Show me my MCP capabilities"
echo.
echo Your workspace: %PROJECT_DIR%
echo.
echo Happy coding!
echo.
pause
