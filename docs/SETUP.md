# Setup Notes

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
