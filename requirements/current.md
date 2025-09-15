# Current Requirements - CLAUDE.md Development Workflow Analysis

> **SCOPE**: Analyze and create comprehensive overview of the CLAUDE.md development workflow including core principles, TDD enforcement, QShortcuts, and sub-agent roles for implementing new features following QNEW protocol.

## REQ-101: Document Core Principles and Rules
- Acceptance: Complete documentation of all 7 core principle categories with MUST/SHOULD requirements
- Coverage: Before Coding (BP-1 to BP-3), While Coding (C-1 to C-5), Testing (T-1 to T-4), Database (D-1 to D-2), Organization (O-1 to O-2), Documentation (DOC-1 to DOC-4), Tooling Gates (G-1 to G-2)
- Output: Structured overview with enforcement levels and practical guidance

## REQ-102: Document Requirements Discipline Pattern
- Acceptance: Complete explanation of requirements.lock pattern workflow
- Coverage: current.md canonical source, requirements.lock.md snapshot mechanism, REQ ID referencing in tests
- Template: Include minimal template structure for requirements documentation
- Integration: Show how pattern integrates with QNEW/QPLAN workflows

## REQ-103: Document TDD Enforcement Flow
- Acceptance: Complete 6-step TDD enforcement flow with agent assignments
- Steps: QNEW/QPLAN (planner + docs-writer), QCODE (test-writer first), implementation, QCHECK phases, QDOC, QGIT
- Agent Roles: Specific agent responsibilities at each phase
- Enforcement: How test-writer blocks implementation without failing tests

## REQ-104: Document QShortcuts and Usage Guidance
- Acceptance: All 8 QShortcuts documented with exact commands and agent assignments
- Commands: QNEW, QPLAN, QCODE, QCHECK, QCHECKF, QCHECKT, QUX, QDOC, QGIT
- Agent Mapping: Which agents activate for each shortcut and when
- Usage Context: When each shortcut should be used in development workflow

## REQ-105: Document Sub-Agent Suite Roles
- Acceptance: Complete catalog of specialized agents and their responsibilities
- Agents: planner, docs-writer, test-writer, PE-Reviewer, security-reviewer, debugger, ux-tester, release-manager
- Specializations: When security-reviewer activates (auth/network/fs/templates/db/crypto)
- Coordination: How agents work together in multi-phase operations

## REQ-106: Document Function Writing Best Practices
- Acceptance: Complete 8-point function evaluation checklist
- Checklist: Readability, cyclomatic complexity, data structures, unused parameters, type casts, testability, dependencies, naming
- Refactoring Rules: When NOT to refactor and compelling reasons for refactoring
- Quality Gates: Practical evaluation criteria for function quality

## REQ-107: Document Testing Best Practices
- Acceptance: Complete 11-point test evaluation checklist
- Coverage: Parameterization, real defect testing, description alignment, independent expectations, code quality, property-based testing, grouping, assertions, edge cases, type checker integration
- Property-Based: Include fast-check library example for algorithmic testing
- Integration: How testing practices align with TDD enforcement flow

## REQ-108: Create Actionable Implementation Guide
- Acceptance: Step-by-step guide for implementing new features using this workflow
- Workflow: From QNEW through QGIT with decision points and agent handoffs
- Examples: Practical examples of requirement writing, test creation, and implementation
- Troubleshooting: Common issues and solutions in workflow execution

## Non-Goals
- Creating new workflow processes (document existing CLAUDE.md workflow only)
- Modifying existing requirements files (analysis and documentation only)
- Implementing code changes (pure documentation and analysis task)

## Success Criteria
1. Complete understanding of all CLAUDE.md workflow components
2. Actionable guidance for new feature development
3. Clear agent role definitions and handoff procedures
4. Comprehensive best practices documentation
5. Requirements properly documented and locked per QNEW protocol