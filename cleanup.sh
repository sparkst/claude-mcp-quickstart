#!/bin/bash

# Clean up repository to only essential files

echo "Cleaning up repository..."

# Files to KEEP
keep_files=(
  "index.js"
  "package.json"
  "README.md"
  "LICENSE"
  ".gitignore"
  ".npmignore"
  ".github/workflows/ci.yml"
)

# Remove everything else
git rm -f install.sh install.bat install.ps1 install-*.sh 2>/dev/null
git rm -f advanced-setup.py installer.py 2>/dev/null
git rm -f npx-installer.js package-npm.json 2>/dev/null
git rm -f package.sh publish-npm.sh uninstall.sh verify.sh 2>/dev/null
git rm -f DEPLOY.md PACKAGE.md README-*.md bootstrap-prompts.md 2>/dev/null
git rm -f index-no-brave.js 2>/dev/null

echo "Repository cleaned!"
echo "Essential files remaining:"
ls -la

echo ""
echo "Now commit and push:"
echo "  git commit -m 'Clean up repository - keep only essentials'"
echo "  git push"
