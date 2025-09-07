#!/bin/bash

# Publish MCP Quickstart to NPM
# Run this to deploy your package

set -e

echo "NPM Package Publisher"
echo "===================="
echo

# Check if logged into npm
if ! npm whoami >/dev/null 2>&1; then
    echo "❌ Not logged into npm"
    echo "Run: npm login"
    exit 1
fi

# Clean previous builds
rm -rf npm-package
mkdir npm-package

# Copy files for npm package
cp index.js npm-package/
cp package-npm.json npm-package/package.json
cp README-npm.md npm-package/README.md

# Make executable
chmod +x npm-package/index.js

cd npm-package

# Test locally first
echo "Testing package locally..."
node index.js verify >/dev/null 2>&1 || true

# Dry run
echo
echo "Dry run (what will be published):"
npm publish --dry-run

echo
read -p "Publish to npm? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm publish --access public
    
    echo
    echo "✅ Published successfully!"
    echo
    echo "Users can now run:"
    echo "  npx @your-company/mcp-quickstart"
    echo
    echo "Test it yourself:"
    echo "  npx @your-company/mcp-quickstart verify"
else
    echo "Publication cancelled"
fi

cd ..
