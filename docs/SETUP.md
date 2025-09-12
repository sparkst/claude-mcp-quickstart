# Setup Notes

## Security Notice
🚨 **P0 Security Fix Applied**: The brain-connection module has been hardened against template injection attacks. All user inputs are now properly escaped to prevent code execution. See [brain-connection-security.md](./brain-connection-security.md) for details.

## Installation Steps

1) Copy the contents of this package into your repo root.
2) Review `.claude/settings.json` and narrow/expand permissions to your comfort.
3) Ensure `scripts/guard-reqs.js` is executable and add to your package.json:

```json
{
  "scripts": {
    "guard:reqs": "node scripts/guard-reqs.js",
    "preqgit": "npm run guard:reqs && npm run lint && npm run typecheck && npm test"
  }
}
```

4) Use QShortcuts in chat:
   - `qnew` → planner + docs-writer (creates requirements and lock)
   - `qplan` → planner (aligns plan with repo patterns)
   - `qcode` → test-writer → implement → debugger if red
   - `qcheck` → PE-Reviewer (+ security-reviewer on sensitive paths)
   - `qdoc` → docs-writer
   - `qgit` → release-manager (runs preqgit, commit & push)

5) Place domain READMEs and optional `.claude-context` files as features grow.

## Security & API Documentation

### Brain Connection Module
- **Security Guide**: [brain-connection-security.md](./brain-connection-security.md) - P0 security fixes and testing strategy
- **API Reference**: [brain-connection-api.md](./brain-connection-api.md) - Complete function documentation and examples

### Testing Requirements
The brain-connection module includes comprehensive security tests:
- Template injection prevention (REQ-202)
- Error boundary coverage (REQ-206) 
- Resource cleanup verification (REQ-204)
- Structured error handling (REQ-205)

Run security tests: `npm test -- brain-connection.spec.js`

### Code Quality Gates
All brain-connection changes must pass:
- ✅ 18 security-specific tests
- ✅ ESLint compliance (Node.js globals enabled)
- ✅ Prettier formatting
- ✅ Template injection prevention validation
