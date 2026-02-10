---
name: wrap-up
description: End-of-session cleanup including version bumping, documentation updates, and code cleanup. Use when the user says "let's wrap up", "wrap up", "finish up", or wants to prepare for deployment.
argument-hint: [major|minor|patch]
---

# Session Wrap-Up

Perform systematic end-of-session tasks:

## 1. Version Management

Read `manifest.json` to get current version. Ask user what type of bump (major/minor/patch, default: patch).

If version has `-alpha` suffix, ask if it should be removed.

Update both files:

- `version` field in `manifest.json`
- `CACHE_NAME` in `sw.js` (format: `nb-cache-v{version}`)

Show changes clearly.

## 2. Documentation Check

**README.md:**

- Compare features listed vs actual implementation
- Identify missing/outdated features
- Ask user if updates needed

**In-game help modal (index.html):**

- Check modal-instructions section
- Ensure consistency with README
- Ask user if updates needed

## 3. Code Cleanup

Search for and report:

- `console.log` statements (Grep)
- `TODO`, `FIXME`, `HACK` comments (Grep)
- Unused imports in JS files
- Test functions like `window.nb.testStars`
- Commented-out code blocks

For each finding, ask: "Keep, remove, or fix?"

## 4. Final Verification

Quick checks:

- All files in `sw.js` CACHE_FILES exist
- No broken imports
- All referenced fonts/icons exist

## 5. Summary

Provide structured output:

```
📦 Version: {old} → {new}
📚 Documentation: [list updates]
🧹 Code Cleanup: [list changes]
✅ Verification: [status]
📝 Files Modified: [list]
```

Be thorough but pragmatic. Focus on issues that matter. Always ask before significant changes.
