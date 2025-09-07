#!/bin/bash

# Package MCP Quickstart for distribution
# Creates ready-to-deploy files

set -e

echo "MCP Quickstart Packager"
echo "======================="

# Create dist directory
rm -rf dist
mkdir -p dist

# Copy only essential files
cp install-minimal.sh dist/install.sh
cp install.ps1 dist/install.ps1
cp verify.sh dist/verify.sh
cp README-CUSTOMER.md dist/README.md

# Make scripts executable
chmod +x dist/*.sh

# Create version file
echo "1.0.0" > dist/VERSION

# Create single-file installer (embeds verify)
cat > dist/install-standalone.sh << 'EOF'
#!/bin/bash
# MCP Quickstart - All-in-one installer with verification

install_mcp() {
EOF

cat install-minimal.sh | tail -n +2 >> dist/install-standalone.sh

cat >> dist/install-standalone.sh << 'EOF'
}

verify_mcp() {
EOF

cat verify.sh | tail -n +2 >> dist/install-standalone.sh

cat >> dist/install-standalone.sh << 'EOF'
}

# Run installation then verification
install_mcp
echo
echo "Running verification..."
echo
verify_mcp
EOF

chmod +x dist/install-standalone.sh

# Create deployment package
cd dist
tar -czf mcp-quickstart.tar.gz *
zip -q mcp-quickstart.zip *
cd ..

echo
echo "✅ Package created in dist/"
echo
echo "Files created:"
echo "  dist/install.sh          - Mac/Linux installer"
echo "  dist/install.ps1         - Windows installer"
echo "  dist/verify.sh           - Verification script"
echo "  dist/README.md           - Customer documentation"
echo "  dist/install-standalone.sh - All-in-one installer"
echo "  dist/mcp-quickstart.tar.gz - Full package (tar)"
echo "  dist/mcp-quickstart.zip   - Full package (zip)"
echo
echo "Deploy options:"
echo "1. Host install.sh at: https://get.your-product.com/install.sh"
echo "2. Host verify.sh at: https://get.your-product.com/verify.sh"
echo "3. Provide download link to mcp-quickstart.zip"
echo
echo "Customer runs:"
echo "  curl -sSL https://get.your-product.com/install.sh | bash"
echo
echo "Success rate tracking:"
echo "  Check web server logs for install.sh downloads"
echo "  vs verify.sh calls with exit code 0"
