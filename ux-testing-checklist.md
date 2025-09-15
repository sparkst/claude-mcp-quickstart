# RUNNABLE UX TESTING CHECKLIST
## Complete System Validation with Data Setup

**Execute this checklist to validate the complete CLAUDE.md workflow system UX across all territories.**

---

## SETUP REQUIREMENTS

### Environment Setup
- [ ] Node.js 18+ installed
- [ ] Git repository initialized
- [ ] Claude MCP Quickstart installed (`npm install -g claude-mcp-quickstart`)
- [ ] Terminal with screen reader support (if testing accessibility)
- [ ] Color contrast analyzer tool available
- [ ] Performance monitoring tools enabled

### Test Data Setup
- [ ] Create test project directory: `mkdir ux-test-project && cd ux-test-project`
- [ ] Initialize git: `git init`
- [ ] Create package.json: `npm init -y`
- [ ] Install testing dependencies: `npm install --save-dev vitest@^1.0.0`
- [ ] Create basic project structure:
  ```
  mkdir -p src/{auth,api,core,ui}
  mkdir -p tests
  mkdir -p requirements
  mkdir -p docs
  ```

### Accessibility Testing Setup
- [ ] Install accessibility testing tools:
  ```bash
  npm install --save-dev @axe-core/cli
  npm install --save-dev pa11y-ci
  ```
- [ ] Configure high contrast terminal theme
- [ ] Enable screen reader (macOS: VoiceOver, Windows: NVDA, Linux: Orca)
- [ ] Install keyboard navigation testing extension

---

## 1. NEW DEVELOPER ONBOARDING TESTS

### TD-001: QNEW Discovery and First Use ⭐ CRITICAL
**Setup Data:**
```bash
# Clean state simulation
rm -rf requirements/
rm -rf .claude/
export CLAUDE_UX_TEST_MODE=true
```

**Test Steps:**
- [ ] **Step 1**: Execute `QNEW` command without any setup
  - **Expected**: Clear error message with setup instructions
  - **Accessibility**: Error message readable by screen reader
  - **Timing Target**: <5 seconds response time

- [ ] **Step 2**: Read CLAUDE.md documentation
  - **Expected**: Understand purpose within 2 minutes
  - **Accessibility**: Documentation has proper heading structure (h1, h2, h3)
  - **Test**: Navigate with Tab key only

- [ ] **Step 3**: Execute QNEW with sample requirement
  ```bash
  # Test requirement
  echo "I need to add user authentication to my app" | claude qnew
  ```
  - **Expected**: Generates requirements/current.md with REQ-001
  - **Accessibility**: Generated files have semantic structure
  - **Performance**: <3 seconds completion

**Accessibility Checks:**
- [ ] Focus moves logically through interface
- [ ] All interactive elements have focus indicators
- [ ] Error states use icons + text (not color only)
- [ ] Screen reader announces progress updates

### TD-002: Requirements Creation Workflow
**Setup Data:**
```bash
# Create sample user story
export TEST_REQUIREMENT="As a user, I want to reset my password via email so I can regain access to my account"
```

**Test Steps:**
- [ ] **Step 1**: Create requirements/current.md manually
  ```markdown
  # Current Requirements

  ## REQ-101: Password reset via email
  - Acceptance: User receives email with secure reset link
  - Acceptance: Link expires after 15 minutes
  - Acceptance: User can set new password successfully
  - Non-Goals: Social login integration
  - Notes: Must comply with security best practices
  ```

- [ ] **Step 2**: Execute QNEW to create lock file
  - **Expected**: requirements/requirements.lock.md created
  - **Accessibility**: Lock file maintains heading structure
  - **Validation**: REQ-101 preserved exactly

- [ ] **Step 3**: Verify REQ ID format validation
  ```bash
  # Test with invalid REQ ID
  echo "## INVALID: Bad format" >> requirements/current.md
  claude qnew
  ```
  - **Expected**: Clear validation error
  - **Accessibility**: Error has aria-live announcement
  - **Recovery**: Guidance for fixing format

**Accessibility Checks:**
- [ ] Form fields have associated labels
- [ ] Required fields clearly marked
- [ ] Validation errors announced to screen reader
- [ ] Tab order follows logical reading flow

### TD-003: Complete Workflow Walkthrough
**Setup Data:**
```bash
# Prepare minimal feature implementation
mkdir -p src/auth
echo "export function resetPassword() { return 'stub'; }" > src/auth/reset.js
```

**Test Steps:**
- [ ] **QNEW Phase** (Target: <30 seconds)
  - Execute: `claude qnew`
  - Validate: Requirements lock created
  - Check: Agent feedback clear

- [ ] **QPLAN Phase** (Target: <2 minutes)
  - Execute: `claude qplan`
  - Validate: Architecture analysis complete
  - Check: Implementation plan generated

- [ ] **QCODE Phase** (Target: <5 minutes)
  - Execute: `claude qcode`
  - Validate: Tests generated first
  - Check: Implementation follows tests
  - **Critical**: TDD enforcement blocks early implementation

- [ ] **QCHECK Phase** (Target: <3 minutes)
  - Execute: `claude qcheck`
  - Validate: Quality review complete
  - Check: Security review if applicable

- [ ] **QDOC Phase** (Target: <1 minute)
  - Execute: `claude qdoc`
  - Validate: Documentation updated
  - Check: README reflects changes

- [ ] **QGIT Phase** (Target: <30 seconds)
  - Execute: `claude qgit`
  - Validate: Changes committed
  - Check: Conventional commit format

**Accessibility Checks for Each Phase:**
- [ ] Progress indicators accessible to screen readers
- [ ] Status messages use semantic markup
- [ ] Error states have sufficient color contrast (4.5:1 minimum)
- [ ] All phases completable with keyboard only

---

## 2. EXPERIENCED DEVELOPER WORKFLOW TESTS

### TD-006: Expert Workflow Efficiency
**Setup Data:**
```bash
# Complex multi-requirement feature
cat > requirements/current.md << EOF
# Current Requirements

## REQ-201: User profile management
- Acceptance: Users can update profile information
- Acceptance: Profile changes require email confirmation
- Acceptance: Profile photos supported with image validation

## REQ-202: User preferences system
- Acceptance: Users can set notification preferences
- Acceptance: Preferences persist across sessions
- Acceptance: Admin can set default preferences
EOF
```

**Performance Test Steps:**
- [ ] **Baseline Timing**: Complete QNEW→QGIT cycle
  - Record total time: _______ minutes
  - Target: <15 minutes for complex feature
  - Bottlenecks identified: _________________

- [ ] **Shortcut Efficiency**: Test keyboard shortcuts
  - qn (QNEW), qp (QPLAN), qc (QCODE), etc.
  - All shortcuts work: ☐ Yes ☐ No
  - Shortcut discovery easy: ☐ Yes ☐ No

- [ ] **Context Switching**: Switch between requirements
  - Change active REQ mid-workflow: ☐ Works ☐ Fails
  - Context preserved: ☐ Yes ☐ No
  - Recovery smooth: ☐ Yes ☐ No

**Accessibility Efficiency Checks:**
- [ ] Keyboard shortcuts documented and discoverable
- [ ] Screen reader users can complete in similar timeframes
- [ ] High contrast mode doesn't break functionality
- [ ] Large text scaling maintains usability

---

## 3. ERROR RECOVERY AND GUIDANCE TESTS

### TD-009: TDD Enforcement Blocking ⭐ CRITICAL
**Setup Data:**
```bash
# Create scenario where developer tries to implement first
mkdir -p src/features
echo "// Implementation without tests" > src/features/payment.js
```

**Test Steps:**
- [ ] **Step 1**: Execute QCODE without tests
  ```bash
  claude qcode
  ```
  - **Expected**: Clear blocking message
  - **Error Format**: "TDD ENFORCEMENT: Cannot proceed to implementation without failing tests"
  - **Accessibility**: Error announced with proper aria-live

- [ ] **Step 2**: Attempt to bypass with force flag
  ```bash
  claude qcode --force
  ```
  - **Expected**: Warning but allows bypass with explicit confirmation
  - **Accessibility**: Confirmation dialog keyboard accessible

- [ ] **Step 3**: Follow proper TDD flow
  ```bash
  claude qcode
  # Should generate tests first, then allow implementation
  ```
  - **Expected**: test-writer creates failing tests
  - **Expected**: Implementation phase unlocked after tests
  - **Accessibility**: Progress clearly communicated

**Error Message Quality Checks:**
- [ ] Error explains WHY blocking occurred
- [ ] Error provides SPECIFIC next steps
- [ ] Error includes helpful examples
- [ ] Error accessible to screen readers
- [ ] Error has sufficient color contrast

### TD-010: Agent Failure Recovery
**Setup Data:**
```bash
# Simulate agent failure conditions
export CLAUDE_SIMULATE_AGENT_FAILURE=PE-Reviewer
```

**Test Steps:**
- [ ] **Step 1**: Trigger agent failure during QCHECK
  ```bash
  claude qcheck
  ```
  - **Expected**: Graceful failure handling
  - **Recovery**: Alternative workflow offered
  - **Accessibility**: Failure state clearly announced

- [ ] **Step 2**: Manual override path
  - **Expected**: Clear manual steps provided
  - **Recovery**: Can complete workflow manually
  - **Documentation**: Override steps documented

- [ ] **Step 3**: Retry mechanism
  - **Expected**: Automatic retry with exponential backoff
  - **Feedback**: Retry attempts communicated clearly
  - **Accessibility**: Retry status announced

**Accessibility Recovery Checks:**
- [ ] Error recovery doesn't break tab order
- [ ] Alternative workflows remain keyboard accessible
- [ ] Manual override instructions readable by screen reader
- [ ] Recovery status has adequate contrast

---

## 4. CROSS-TERRITORY INTEGRATION TESTS

### TD-013: Seamless Territory Handoffs
**Setup Data:**
```bash
# Multi-territory feature affecting all areas
cat > requirements/current.md << EOF
# Current Requirements

## REQ-301: User authentication system
- Acceptance: JWT token-based authentication (Territory A)
- Acceptance: TDD-enforced test coverage (Territory B)
- Acceptance: Multi-agent coordination for security review (Territory C)
- Acceptance: Full system integration testing (Territory D)
EOF
```

**Integration Test Steps:**
- [ ] **Territory A→B Handoff**: CLAUDE.md principles to TDD enforcement
  - Handoff visible: ☐ Yes ☐ No
  - Context preserved: ☐ Yes ☐ No
  - Status clear: ☐ Yes ☐ No

- [ ] **Territory B→C Handoff**: TDD enforcement to agent coordination
  - Test results passed to agents: ☐ Yes ☐ No
  - Agent selection appropriate: ☐ Yes ☐ No
  - Coordination transparent: ☐ Yes ☐ No

- [ ] **Territory C→D Handoff**: Agent coordination to system integration
  - Agent results integrated: ☐ Yes ☐ No
  - System state consistent: ☐ Yes ☐ No
  - Final validation complete: ☐ Yes ☐ No

**Cross-Territory Accessibility Checks:**
- [ ] Handoff status visible to screen readers
- [ ] Territory boundaries don't break navigation flow
- [ ] Progress indicators work across territories
- [ ] Consistent interaction patterns maintained

---

## 5. ACCESSIBILITY COMPREHENSIVE TESTS

### TD-016: Keyboard-Only Operation ⭐ CRITICAL
**Setup Data:**
```bash
# Disable mouse/pointer for testing
export ACCESSIBILITY_TEST_MODE=keyboard-only
```

**Keyboard Navigation Tests:**
- [ ] **Tab Order Validation**:
  - Start: Beginning of workflow ☐ Logical ☐ Skip ☐ Trap
  - QNEW phase: ☐ Logical ☐ Skip ☐ Trap
  - QPLAN phase: ☐ Logical ☐ Skip ☐ Trap
  - QCODE phase: ☐ Logical ☐ Skip ☐ Trap
  - QCHECK phase: ☐ Logical ☐ Skip ☐ Trap
  - QDOC phase: ☐ Logical ☐ Skip ☐ Trap
  - QGIT phase: ☐ Logical ☐ Skip ☐ Trap

- [ ] **Focus Indicators**:
  - Visible focus ring: ☐ Always ☐ Sometimes ☐ Never
  - High contrast: ☐ 4.5:1 ☐ 3:1 ☐ Less
  - Focus not lost during navigation: ☐ Yes ☐ No

- [ ] **Keyboard Shortcuts**:
  ```bash
  # Test all shortcuts work
  Alt+N  # QNEW - ☐ Works ☐ Fails
  Alt+P  # QPLAN - ☐ Works ☐ Fails
  Alt+C  # QCODE - ☐ Works ☐ Fails
  Alt+K  # QCHECK - ☐ Works ☐ Fails
  Alt+D  # QDOC - ☐ Works ☐ Fails
  Alt+G  # QGIT - ☐ Works ☐ Fails
  ```

### TD-018: Color Contrast and Information Design
**Color Accessibility Validation:**
- [ ] **Success States**: Use checkmarks + color (☐ Yes ☐ Color only)
- [ ] **Error States**: Use X icons + color (☐ Yes ☐ Color only)
- [ ] **Warning States**: Use warning icons + color (☐ Yes ☐ Color only)
- [ ] **Progress States**: Use progress text + visual (☐ Yes ☐ Visual only)

**Contrast Measurements:**
```bash
# Test with color contrast analyzer
contrast-ratio --foreground="#000000" --background="#ffffff"  # Should be ≥4.5:1
```
- [ ] Normal text: ___:1 (≥4.5:1 required)
- [ ] Large text: ___:1 (≥3:1 required)
- [ ] Focus indicators: ___:1 (≥4.5:1 required)
- [ ] Error messages: ___:1 (≥4.5:1 required)

### TD-019: Screen Reader Compatibility
**Screen Reader Test Protocol:**
- [ ] **Setup Screen Reader**:
  - macOS: VoiceOver (Cmd+F5)
  - Windows: NVDA (free download)
  - Linux: Orca (pre-installed)

**Navigation Tests:**
- [ ] **Heading Navigation**: Can navigate by headings (H key)
- [ ] **Landmark Navigation**: Can navigate by landmarks (D key)
- [ ] **Form Navigation**: Can navigate form fields (F key)
- [ ] **List Navigation**: Can navigate lists (L key)

**Content Tests:**
- [ ] **Status Announcements**: Progress updates announced automatically
- [ ] **Error Announcements**: Errors announced when they occur
- [ ] **Success Announcements**: Completions announced clearly
- [ ] **Help Text**: Helper text read with form fields

**Testing Commands:**
```bash
# Test with screen reader active
claude qnew
# Listen for: "Starting new requirements workflow. Focus moved to requirements input."

claude qcode
# Listen for: "Beginning test-driven development phase. Generating failing tests."

claude qcheck
# Listen for: "Quality review phase. Processing code analysis."
```

---

## 6. PERFORMANCE AND LOAD TESTING

### TD-021: Single User Performance Baseline
**Performance Measurement Setup:**
```bash
# Install performance monitoring
npm install --save-dev clinic
export PERFORMANCE_TEST_MODE=true
```

**Baseline Measurements:**
- [ ] **QNEW Performance**:
  ```bash
  time claude qnew
  # Record: _____ seconds (Target: <2s)
  ```

- [ ] **QPLAN Performance**:
  ```bash
  time claude qplan
  # Record: _____ seconds (Target: <5s)
  ```

- [ ] **QCODE Performance**:
  ```bash
  time claude qcode
  # Record: _____ seconds (Target: <3s for test generation)
  ```

- [ ] **Agent Activation**:
  ```bash
  time claude qcheck
  # Record agent startup: _____ seconds (Target: <1s)
  ```

**Memory Usage:**
- [ ] Peak memory usage: _____ MB (Target: <100MB)
- [ ] Memory leaks detected: ☐ None ☐ Minor ☐ Major
- [ ] GC pressure: ☐ Low ☐ Medium ☐ High

---

## 7. FINAL CERTIFICATION CHECKLIST

### Production Readiness Validation
- [ ] **Functional Requirements**:
  - All QShortcuts work: ☐ Yes ☐ No
  - TDD enforcement blocks correctly: ☐ Yes ☐ No
  - Agent coordination transparent: ☐ Yes ☐ No
  - Error recovery functional: ☐ Yes ☐ No

- [ ] **Accessibility Requirements** (WCAG 2.1 AA):
  - Keyboard navigation: ☐ 100% ☐ Partial ☐ Broken
  - Screen reader support: ☐ Full ☐ Partial ☐ None
  - Color contrast: ☐ ≥4.5:1 ☐ ≥3:1 ☐ <3:1
  - Focus management: ☐ Perfect ☐ Good ☐ Poor

- [ ] **Performance Requirements**:
  - Response times within targets: ☐ Yes ☐ No
  - Memory usage acceptable: ☐ Yes ☐ No
  - No performance regressions: ☐ Yes ☐ No

- [ ] **UX Requirements**:
  - New developer onboarding: ☐ <15min ☐ 15-30min ☐ >30min
  - Expert workflow efficiency: ☐ 50%+ faster ☐ Same ☐ Slower
  - Error recovery: ☐ <2min ☐ 2-5min ☐ >5min

### Launch Decision
**GO/NO-GO Criteria:**
- [ ] All critical tests (⭐) pass
- [ ] Accessibility compliance achieved (WCAG 2.1 AA)
- [ ] Performance targets met
- [ ] No critical bugs identified
- [ ] Documentation complete and tested

**Final Score:**
- Tests Passed: ___/50 required for production
- Accessibility Score: ___% (≥95% required)
- Performance Score: ___% (≥90% required)
- User Experience Score: ___/5 (≥4.0 required)

**CERTIFICATION RESULT:**
☐ **APPROVED FOR PRODUCTION** - All criteria met
☐ **CONDITIONAL APPROVAL** - Minor issues identified, plan for resolution
☐ **NOT APPROVED** - Critical issues must be resolved before production

---

## EXECUTION NOTES

**Test Environment:**
- OS: ________________
- Node Version: ________________
- Terminal: ________________
- Screen Reader: ________________
- Test Date: ________________
- Tester: ________________

**Critical Issues Found:**
1. ________________________________
2. ________________________________
3. ________________________________

**Recommendations:**
1. ________________________________
2. ________________________________
3. ________________________________

**Next Steps:**
- [ ] Address critical issues
- [ ] Re-run failed tests
- [ ] Update documentation
- [ ] Schedule production deployment