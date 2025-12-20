# Pre-Release Cleaning Checklist for Knutpunkt

## High Priority (Must Fix Before Public Release)

### 1. Remove Development/Personal Files
- [ ] **Delete `.claude/` directory** - Personal Claude Code settings
- [ ] **Delete `.idea/` directory** - Personal IntelliJ IDEA settings (add to .gitignore)
- [ ] **Delete `.playwright-mcp/` directory** - Development screenshots/artifacts
- [ ] **Delete `notes/` directory** - Internal development notes
- [ ] **Delete `scripts/ws-test/` directory** - Development testing scripts
- [ ] **Delete `frontend/src/components/.DS_Store`** - macOS artifact
- [ ] **Delete `backend/.kotlin/errors/errors-*.log`** - Build error logs

### 2. Clean Task Files (Choose Approach)
**Option A: Archive completed tasks (Recommended)**
- [ ] Move all `tasks/done/*.md` to a separate `tasks/archive/` directory
- [ ] Keep only the single planned task in `tasks/planned/`
- [ ] Add note in README that these are example/seed tasks

**Option B: Remove all task files**
- [ ] Delete all `.md` files from `tasks/*/` 
- [ ] Create example task files for demonstration
- [ ] Document task file format in README

### 3. Update Documentation
- [ ] **Update README.md**
  - Remove "(to be implemented)" statements - project is implemented!
  - Update Quick Start with actual build/run commands
  - Add screenshots/demo GIF
  - Add proper license section
  - Remove reference to CLAUDE.md or move it elsewhere
  
- [ ] **Update CHANGELOG.md**
  - Replace `yourusername` with `karlll` in URLs (lines 40-41)
  
- [ ] **Rename or Remove CLAUDE.md**
  - This is internal development documentation
  - Options:
    - Rename to `DEVELOPMENT.md` or `ARCHITECTURE.md`
    - Move to `docs/` directory
    - Remove entirely and integrate relevant parts into README

- [ ] **Update README.deployment.md**
  - Fix JAR version reference (currently says "1.0.0" but code shows "0.9.0")
  - Remove `com.ninjacontrol` package name references or explain it's your namespace

### 4. Add Missing Files
- [ ] **Create LICENSE file** (choose: MIT, Apache 2.0, GPL, etc.)
- [ ] **Create CONTRIBUTING.md** (optional but recommended for open source)
- [ ] **Create .github/ISSUE_TEMPLATE/** (optional but helpful)
- [ ] **Create .github/PULL_REQUEST_TEMPLATE.md** (optional)

### 5. Update .gitignore
- [ ] Add `.idea/` to .gitignore
- [ ] Add `.DS_Store` to .gitignore root (already in "OS" section but should include subdirs)
- [ ] Add `*.log` patterns more specifically
- [ ] Add `.claude/` to .gitignore

## Medium Priority (Should Fix)

### 6. Code Cleanup
- [ ] Review and address TODOs in `notes/terminal-backend-architecture.md`
  - If keeping notes, these are implementation TODOs
  - If removing notes, verify these are actually done

### 7. Configuration
- [ ] Review hardcoded references to `com.ninjacontrol` package name
  - This is fine if it's your organization name
  - Add note in README that it's the package namespace

### 8. GitHub Repository Settings
- [ ] Add repository description
- [ ] Add repository topics/tags: `kanban`, `task-management`, `kotlin`, `react`, `ktor`, `markdown`, etc.
- [ ] Enable GitHub Discussions (optional)
- [ ] Enable GitHub Wiki (optional)
- [ ] Configure branch protection rules for `main`
- [ ] Set up GitHub Pages for documentation (optional)

### 9. Build Artifacts
- [ ] Verify `build/` directory is in .gitignore (✓ already done)
- [ ] Clean any cached build artifacts before release
  ```bash
  make clean
  rm -rf build/
  ./gradlew clean
  ```

## Low Priority (Nice to Have)

### 10. Documentation Enhancements
- [ ] Add architecture diagram to README
- [ ] Add API documentation link
- [ ] Add troubleshooting section to README
- [ ] Create `docs/` directory for detailed documentation
  - API.md
  - ARCHITECTURE.md  
  - DEPLOYMENT.md
  - DEVELOPMENT.md (move CLAUDE.md content here)

### 11. Demo/Marketing
- [ ] Add screenshots to README
- [ ] Create demo GIF showing drag-and-drop
- [ ] Add "Features" section highlighting key capabilities
- [ ] Add "Why Knutpunkt?" section

### 12. Project Metadata
- [ ] Add keywords to package.json files
- [ ] Add repository URL to package.json files
- [ ] Add homepage URL to package.json files
- [ ] Verify version consistency across all files

## Verification Steps

Before making repository public:

1. [ ] Clone repository to fresh directory
2. [ ] Follow README build instructions
3. [ ] Verify application runs correctly
4. [ ] Check all links in documentation work
5. [ ] Verify no sensitive information in git history
6. [ ] Run full test suite: `make test` (if exists)
7. [ ] Review all committed files for personal/sensitive data

## Recommended File Structure After Cleanup

```
knutpunkt/
├── .github/
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── api/
├── backend/
├── frontend/
├── mcp-server/
├── scripts/
│   └── release.sh
├── tasks/                    # Example/seed tasks only
│   ├── planned/
│   ├── ongoing/
│   └── done/
├── .gitignore
├── CHANGELOG.md
├── CONTRIBUTING.md           # NEW
├── LICENSE                   # NEW
├── Makefile
├── README.md                 # UPDATED
└── start.sh
```

## Commands to Execute

```bash
# Remove development files
rm -rf .claude
rm -rf .idea  
rm -rf .playwright-mcp
rm -rf notes
rm -rf scripts/ws-test
find . -name ".DS_Store" -delete
find backend/.kotlin -name "*.log" -delete

# Archive completed tasks (or delete)
mkdir -p tasks/archive
mv tasks/done/*.md tasks/archive/ 2>/dev/null || true

# Update .gitignore
echo ".idea/" >> .gitignore
echo ".claude/" >> .gitignore
echo "**/.DS_Store" >> .gitignore

# Clean build artifacts
make clean
./backend/gradlew clean
rm -rf build/
```
