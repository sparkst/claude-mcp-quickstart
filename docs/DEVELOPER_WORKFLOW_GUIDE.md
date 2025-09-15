# Developer Workflow Guide - Complete Implementation Tutorial

> **Complete step-by-step guide for implementing features using the CLAUDE.md workflow system**

## Table of Contents
1. [Quick Start for New Developers](#quick-start-for-new-developers)
2. [Complete Feature Development Tutorial](#complete-feature-development-tutorial)
3. [Advanced Workflow Patterns](#advanced-workflow-patterns)
4. [Multi-Developer Coordination](#multi-developer-coordination)
5. [Error Recovery Procedures](#error-recovery-procedures)
6. [Performance Optimization](#performance-optimization)

---

## Quick Start for New Developers

### Essential Files Setup

Before starting, ensure these files exist in your project:

```bash
# Required directory structure
requirements/
├── current.md              # Canonical requirements (living document)
├── requirements.lock.md    # Snapshot for current task
└── archive/               # Completed requirements

.claude/
├── settings.json          # Permissions & security
└── agents/               # Agent definitions
    ├── planner.md
    ├── test-writer.md
    ├── pe-reviewer.md
    ├── security-reviewer.md
    ├── docs-writer.md
    ├── debugger.md
    ├── ux-tester.md
    └── release-manager.md
```

### Setup Script

Run this to initialize the workflow in your project:

```bash
#!/bin/bash
# setup-claude-workflow.sh

mkdir -p .claude/agents requirements/archive

# Basic settings.json
cat > .claude/settings.json << 'EOF'
{
  "defaultMode": "acceptEdits",
  "permissions": {
    "deny": [
      "Read(*.env)",
      "Read(**/*.key)",
      "Bash(rm -rf *)"
    ],
    "allow": [
      "Read(./**)",
      "Edit(./**)",
      "Bash(npm run test)",
      "Bash(git add *)",
      "Bash(git commit -m *)"
    ]
  }
}
EOF

# Requirements template
cat > requirements/current.md << 'EOF'
# Current Requirements

## REQ-001: Example Feature
- Acceptance: Clear, testable acceptance criteria
- Non-Goals: What this feature explicitly excludes
- Notes: Additional context, links, or dependencies
EOF

echo "✅ Claude workflow initialized!"
```

### The 6-Step Development Flow

```bash
# 1. QNEW - Start new feature
QNEW
# Creates requirements with REQ-IDs
# Activates: planner → docs-writer

# 2. QPLAN - Plan implementation
QPLAN
# Analyzes codebase for consistency
# Activates: planner

# 3. QCODE - Implement with TDD
QCODE
# Forces failing tests first
# Activates: test-writer → implementation

# 4. QCHECK - Quality review
QCHECK
# Comprehensive code review
# Activates: PE-Reviewer + security-reviewer (conditional)

# 5. QDOC - Document changes
QDOC
# Updates documentation
# Activates: docs-writer

# 6. QGIT - Commit with validation
QGIT
# Validates all gates and commits
# Activates: release-manager
```

---

## Complete Feature Development Tutorial

### Example: Password Reset Feature

Let's walk through implementing a complete password reset feature from start to finish.

#### Step 1: QNEW - Requirements Definition

**Command:**
```bash
QNEW "Implement secure password reset flow"
```

**What Happens:**
1. **planner** agent analyzes the feature request
2. Extracts key requirements and creates REQ-IDs
3. **docs-writer** snapshots to requirements.lock.md

**Generated requirements/current.md:**
```markdown
# Current Requirements

## REQ-401: Password Reset Request Flow
- Acceptance:
  - User can request password reset via email address
  - System sends reset link to verified email only
  - Reset link expires after 15 minutes
  - User receives confirmation of request submission
- Non-Goals: Social login password reset, SMS-based reset
- Notes: Must integrate with existing email service

## REQ-402: Password Reset Security
- Acceptance:
  - Reset tokens are cryptographically secure (256-bit)
  - Tokens are single-use only
  - Tokens are stored hashed in database
  - Failed reset attempts are rate-limited (5 per 15 minutes)
- Security: High priority - requires security-reviewer
- Notes: Use crypto.randomBytes for token generation

## REQ-403: Password Reset Completion
- Acceptance:
  - User can set new password via valid reset link
  - New password must meet complexity requirements
  - Old password is immediately invalidated
  - All active sessions are terminated
  - User receives confirmation email
- Dependencies: REQ-401, REQ-402
```

**Generated requirements/requirements.lock.md:**
```markdown
# Requirements Lock - Password Reset Feature
> Snapshot created: 2024-01-15T10:30:00Z
> Task: Implement secure password reset flow

[Same content as current.md above]

## Implementation Notes
- Priority: REQ-402 (security) must be implemented first
- Integration: Extends existing authentication system
- Testing: All REQ-IDs must have failing tests before implementation
```

#### Step 2: QPLAN - Implementation Planning

**Command:**
```bash
QPLAN
```

**planner Agent Analysis:**
```
🔍 CODEBASE ANALYSIS:

✅ Existing Components Found:
- src/services/email.js - EmailService with template support
- src/auth/tokens.js - TokenService for JWT handling
- src/middleware/rateLimit.js - Rate limiting middleware
- src/models/User.js - User model with password methods
- src/utils/crypto.js - Crypto utilities (needs extension)

🎯 RECOMMENDED APPROACH:

1. Extend TokenService with password reset token methods
2. Create PasswordResetController with 3 endpoints:
   - POST /auth/reset-request
   - GET /auth/reset-verify/:token
   - POST /auth/reset-complete
3. Add email templates for reset notifications
4. Integrate existing rate limiting middleware

📋 IMPLEMENTATION PLAN:

Phase 1: Core token service (REQ-402)
├── Add secure token generation to TokenService
├── Add token storage with expiry
└── Add token validation methods

Phase 2: Request flow (REQ-401)
├── Create reset request endpoint
├── Add email notification service
└── Add rate limiting integration

Phase 3: Completion flow (REQ-403)
├── Create reset completion endpoint
├── Add password validation
├── Add session termination
└── Add confirmation notifications

🔄 CONSISTENCY CHECK:
✅ Follows existing auth patterns
✅ Reuses email infrastructure
✅ Maintains security standards
✅ Uses established error handling
```

#### Step 3: QCODE - Test-Driven Implementation

**Command:**
```bash
QCODE
```

**test-writer Agent Process:**

1. **Parses requirements.lock.md** for REQ-IDs
2. **Generates failing tests** for each requirement
3. **Validates tests fail** before allowing implementation

**Generated Tests (src/auth/__tests__/password-reset.spec.ts):**

```typescript
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { PasswordResetService } from '../password-reset';
import { EmailService } from '../../services/email';
import { TokenService } from '../tokens';
import { RateLimitService } from '../../services/rate-limit';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let emailService: EmailService;
  let tokenService: TokenService;
  let rateLimitService: RateLimitService;

  beforeEach(() => {
    emailService = new EmailService();
    tokenService = new TokenService();
    rateLimitService = new RateLimitService();
    service = new PasswordResetService({
      emailService,
      tokenService,
      rateLimitService
    });
  });

  describe('requestReset', () => {
    test('REQ-401 — sends reset email for valid user', async () => {
      const email = 'user@example.com';
      const mockUser = { id: 1, email, verified: true };

      vi.spyOn(service, 'findUserByEmail').mockResolvedValue(mockUser);
      vi.spyOn(emailService, 'sendResetEmail').mockResolvedValue(true);

      const result = await service.requestReset(email);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Reset link sent to email');
      expect(emailService.sendResetEmail).toHaveBeenCalledWith(
        email,
        expect.stringMatching(/^[a-f0-9]{64}$/) // 256-bit hex token
      );
    });

    test('REQ-401 — reset link expires after 15 minutes', async () => {
      const email = 'user@example.com';
      const beforeRequest = Date.now();

      const result = await service.requestReset(email);
      const token = result.token;
      const tokenData = await service.getTokenData(token);

      const expectedExpiry = beforeRequest + (15 * 60 * 1000);
      expect(tokenData.expiresAt.getTime()).toBeCloseTo(expectedExpiry, -1000);
    });

    test('REQ-402 — generates cryptographically secure tokens', async () => {
      const email = 'user@example.com';

      const results = await Promise.all([
        service.requestReset(email),
        service.requestReset(email),
        service.requestReset(email)
      ]);

      const tokens = results.map(r => r.token);

      // All tokens should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);

      // All tokens should be 64-character hex (256-bit)
      tokens.forEach(token => {
        expect(token).toMatch(/^[a-f0-9]{64}$/);
      });
    });

    test('REQ-402 — enforces rate limiting', async () => {
      const email = 'user@example.com';

      // Make 5 requests (should succeed)
      for (let i = 0; i < 5; i++) {
        const result = await service.requestReset(email);
        expect(result.success).toBe(true);
      }

      // 6th request should be rate limited
      const result = await service.requestReset(email);
      expect(result.success).toBe(false);
      expect(result.error).toBe('RATE_LIMITED');
      expect(result.message).toContain('Too many reset requests');
    });
  });

  describe('completeReset', () => {
    test('REQ-403 — accepts valid token and new password', async () => {
      const token = 'valid_reset_token_64_chars_long_hex_string_example_token';
      const newPassword = 'NewSecureP@ssw0rd123';

      vi.spyOn(service, 'validateResetToken').mockResolvedValue({
        valid: true,
        userId: 1,
        email: 'user@example.com'
      });

      const result = await service.completeReset(token, newPassword);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password reset successfully');
    });

    test('REQ-403 — validates password complexity', async () => {
      const token = 'valid_reset_token';
      const weakPassword = '123';

      const result = await service.completeReset(token, weakPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe('WEAK_PASSWORD');
      expect(result.requirements).toContain('minimum 8 characters');
    });

    test('REQ-403 — terminates all active sessions', async () => {
      const token = 'valid_reset_token';
      const newPassword = 'SecureP@ssw0rd123';
      const userId = 1;

      vi.spyOn(service, 'validateResetToken').mockResolvedValue({
        valid: true,
        userId,
        email: 'user@example.com'
      });
      vi.spyOn(service, 'terminateUserSessions').mockResolvedValue(3); // 3 sessions terminated

      const result = await service.completeReset(token, newPassword);

      expect(result.success).toBe(true);
      expect(service.terminateUserSessions).toHaveBeenCalledWith(userId);
    });

    test('REQ-402 — tokens are single-use only', async () => {
      const token = 'valid_reset_token';
      const password = 'SecureP@ssw0rd123';

      // First use should succeed
      const firstResult = await service.completeReset(token, password);
      expect(firstResult.success).toBe(true);

      // Second use should fail
      const secondResult = await service.completeReset(token, password);
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toBe('TOKEN_ALREADY_USED');
    });
  });
});
```

**test-writer Execution:**
```bash
Running tests to ensure they fail...

✅ All tests fail as expected:
❌ REQ-401 — sends reset email for valid user
   TypeError: PasswordResetService is not a constructor
❌ REQ-401 — reset link expires after 15 minutes
   TypeError: PasswordResetService is not a constructor
❌ REQ-402 — generates cryptographically secure tokens
   TypeError: PasswordResetService is not a constructor

🚦 TDD GATE: Tests failing correctly - implementation may proceed
```

**Implementation Phase:**

Now we implement the PasswordResetService to make tests pass:

```typescript
// src/auth/password-reset.ts
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { EmailService } from '../services/email';
import { TokenService } from './tokens';
import { RateLimitService } from '../services/rate-limit';
import { UserModel } from '../models/User';

export class PasswordResetService {
  private emailService: EmailService;
  private tokenService: TokenService;
  private rateLimitService: RateLimitService;
  private resetTokens = new Map(); // In production: use Redis/database

  constructor({ emailService, tokenService, rateLimitService }) {
    this.emailService = emailService;
    this.tokenService = tokenService;
    this.rateLimitService = rateLimitService;
  }

  async requestReset(email: string) {
    // REQ-402: Check rate limiting
    const rateLimitKey = `password_reset:${email}`;
    if (!this.rateLimitService.isAllowed(rateLimitKey, 5, 15 * 60 * 1000)) {
      return {
        success: false,
        error: 'RATE_LIMITED',
        message: 'Too many reset requests. Please wait 15 minutes.'
      };
    }

    // Find user by email
    const user = await this.findUserByEmail(email);
    if (!user || !user.verified) {
      // Security: Don't reveal if email exists
      return {
        success: true,
        message: 'Reset link sent to email'
      };
    }

    // REQ-402: Generate cryptographically secure token
    const token = crypto.randomBytes(32).toString('hex'); // 256-bit

    // REQ-401: Set 15-minute expiry
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Store token with user info
    this.resetTokens.set(token, {
      userId: user.id,
      email: user.email,
      expiresAt,
      used: false
    });

    // Send reset email
    await this.emailService.sendResetEmail(email, token);

    return {
      success: true,
      message: 'Reset link sent to email',
      token // For testing purposes
    };
  }

  async completeReset(token: string, newPassword: string) {
    // Validate token
    const tokenValidation = await this.validateResetToken(token);
    if (!tokenValidation.valid) {
      return {
        success: false,
        error: tokenValidation.error,
        message: tokenValidation.message
      };
    }

    // REQ-403: Validate password complexity
    const passwordValidation = this.validatePasswordComplexity(newPassword);
    if (!passwordValidation.valid) {
      return {
        success: false,
        error: 'WEAK_PASSWORD',
        message: 'Password does not meet requirements',
        requirements: passwordValidation.requirements
      };
    }

    // Update user password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await UserModel.updatePassword(tokenValidation.userId, hashedPassword);

    // REQ-403: Terminate all active sessions
    await this.terminateUserSessions(tokenValidation.userId);

    // REQ-402: Mark token as used (single-use)
    const tokenData = this.resetTokens.get(token);
    tokenData.used = true;
    this.resetTokens.set(token, tokenData);

    // Send confirmation email
    await this.emailService.sendPasswordChangedConfirmation(tokenValidation.email);

    return {
      success: true,
      message: 'Password reset successfully'
    };
  }

  private async findUserByEmail(email: string) {
    return UserModel.findByEmail(email);
  }

  private async validateResetToken(token: string) {
    const tokenData = this.resetTokens.get(token);

    if (!tokenData) {
      return { valid: false, error: 'INVALID_TOKEN', message: 'Invalid reset token' };
    }

    if (tokenData.used) {
      return { valid: false, error: 'TOKEN_ALREADY_USED', message: 'Reset token already used' };
    }

    if (new Date() > tokenData.expiresAt) {
      return { valid: false, error: 'TOKEN_EXPIRED', message: 'Reset token expired' };
    }

    return {
      valid: true,
      userId: tokenData.userId,
      email: tokenData.email
    };
  }

  private validatePasswordComplexity(password: string) {
    const requirements = [];

    if (password.length < 8) {
      requirements.push('minimum 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      requirements.push('at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      requirements.push('at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      requirements.push('at least one number');
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)) {
      requirements.push('at least one special character');
    }

    return {
      valid: requirements.length === 0,
      requirements
    };
  }

  private async terminateUserSessions(userId: number) {
    // Implementation to terminate all user sessions
    return UserModel.terminateAllSessions(userId);
  }

  async getTokenData(token: string) {
    return this.resetTokens.get(token);
  }
}
```

**Verify Tests Pass:**
```bash
npm test -- password-reset.spec.ts

✅ REQ-401 — sends reset email for valid user
✅ REQ-401 — reset link expires after 15 minutes
✅ REQ-402 — generates cryptographically secure tokens
✅ REQ-402 — enforces rate limiting
✅ REQ-403 — accepts valid token and new password
✅ REQ-403 — validates password complexity
✅ REQ-403 — terminates all active sessions
✅ REQ-402 — tokens are single-use only

8 tests passed in 1.2s
```

#### Step 4: QCHECK - Comprehensive Quality Review

**Command:**
```bash
QCHECK
```

**PE-Reviewer Analysis:**

```
🔍 FUNCTION QUALITY REVIEW (8-point checklist):

✅ 1. Readability: Methods are clear with single responsibilities
✅ 2. Cyclomatic Complexity: Each method has low complexity with clear paths
✅ 3. Data Structures: Appropriate use of Map for tokens, proper crypto usage
✅ 4. Unused Parameters: No unused parameters detected
✅ 5. Type Casts: TypeScript types are explicit and appropriate
✅ 6. Testability: All methods easily testable with clear interfaces
✅ 7. Dependencies: Clean dependency injection, no hidden dependencies
✅ 8. Naming: Domain-appropriate names (requestReset, completeReset, validateResetToken)

📋 TEST QUALITY REVIEW (11-point checklist):

✅ 1. Parameterized Inputs: Uses clear, named variables
✅ 2. Real Defect Testing: Each test validates specific failure scenarios
✅ 3. Description Alignment: Test names precisely describe assertions
✅ 4. Independent Expectations: Tests validate against domain requirements
✅ 5. Code Quality: Tests follow production code standards
⚠️  6. Property-Based Testing: Could add for token uniqueness validation
✅ 7. Test Organization: Proper describe/test structure with REQ-ID references
✅ 8. Flexible Assertions: Uses expect.stringMatching for patterns
✅ 9. Strong Assertions: Precise assertions throughout
✅ 10. Edge Case Coverage: Tests boundaries, rate limits, expiry
✅ 11. Type Checker Integration: No redundant type-checked tests

🏆 OVERALL SCORE: 95/100
```

**security-reviewer Activation (crypto/auth detected):**

```
🛡️ SECURITY REVIEW - ACTIVATED:

🔍 CRYPTOGRAPHIC ANALYSIS:
✅ Token Generation: Uses crypto.randomBytes(32) - cryptographically secure
✅ Token Length: 256-bit tokens provide adequate entropy
✅ Password Hashing: Uses bcrypt with cost factor 12
✅ Rate Limiting: Implements proper rate limiting (5 requests/15 minutes)

🔍 AUTHENTICATION SECURITY:
✅ Token Storage: Includes expiry and single-use flags
✅ Session Management: Properly terminates sessions on password change
✅ Information Disclosure: Doesn't reveal email existence

⚠️  SECURITY RECOMMENDATIONS:

1. CRITICAL: Token storage in Map is not suitable for production
   - Recommendation: Use Redis or database with proper cleanup
   - Impact: Tokens persist across server restarts

2. MODERATE: Consider HTTPS-only requirement for reset links
   - Recommendation: Add middleware to enforce HTTPS
   - Impact: Prevents token interception

3. LOW: Add additional entropy sources
   - Recommendation: Consider combining crypto.randomBytes with timestamp
   - Impact: Defense in depth

🔒 SECURITY SCORE: 8.5/10 (Production deployment needs Redis/DB storage)
```

**Addressing Security Feedback:**

```typescript
// Enhanced version with security improvements
export class PasswordResetService {
  // Use Redis for production token storage
  private tokenStorage: RedisTokenStorage;

  constructor({ emailService, tokenService, rateLimitService, tokenStorage }) {
    this.emailService = emailService;
    this.tokenService = tokenService;
    this.rateLimitService = rateLimitService;
    this.tokenStorage = tokenStorage; // Redis implementation
  }

  private generateSecureToken(): string {
    // Additional entropy for defense in depth
    const randomBytes = crypto.randomBytes(32);
    const timestamp = Date.now().toString();
    const combined = Buffer.concat([randomBytes, Buffer.from(timestamp)]);
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  // ... rest of implementation with Redis storage
}
```

#### Step 5: QDOC - Documentation Update

**Command:**
```bash
QDOC
```

**docs-writer Updates:**

```markdown
# Authentication System - Password Reset

## Overview
Secure password reset flow allowing users to reset passwords via email verification.

## Security Features
- Cryptographically secure 256-bit tokens
- 15-minute token expiry
- Single-use token enforcement
- Rate limiting (5 requests per 15 minutes)
- All sessions terminated on password change
- Secure password complexity requirements

## API Endpoints

### POST /auth/reset-request
Request password reset for email address.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reset link sent to email"
}
```

### POST /auth/reset-complete
Complete password reset with token and new password.

**Request:**
```json
{
  "token": "64-character-hex-token",
  "newPassword": "SecureP@ssw0rd123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

## Implementation Notes
- Tokens stored in Redis for production scalability
- Email service integration for notifications
- Comprehensive test coverage with property-based testing
- Security review completed for all crypto operations
```

#### Step 6: QGIT - Final Commit

**Command:**
```bash
QGIT
```

**release-manager Validation:**

```
🚦 QUALITY GATES VALIDATION:

✅ Tests: All 8 tests passing
✅ Linting: No ESLint violations
✅ Type Checking: TypeScript compilation successful
✅ Formatting: Prettier formatting correct
✅ Coverage: 100% coverage for new code
✅ Security: Security review completed with recommendations addressed

📝 GENERATING COMMIT MESSAGE:

feat(auth): implement secure password reset flow

- Add PasswordResetService with cryptographically secure tokens (REQ-402)
- Implement 15-minute token expiry and single-use enforcement (REQ-401, REQ-402)
- Add rate limiting for reset requests (5 per 15 minutes) (REQ-402)
- Include comprehensive password complexity validation (REQ-403)
- Add session termination on password change (REQ-403)
- Comprehensive test coverage with property-based testing
- Security review completed for all crypto operations

Closes: REQ-401, REQ-402, REQ-403
Breaking: None
Security: High - crypto operations reviewed and approved
```

**Final Git Operations:**
```bash
git add .
git commit -m "feat(auth): implement secure password reset flow

- Add PasswordResetService with cryptographically secure tokens (REQ-402)
- Implement 15-minute token expiry and single-use enforcement (REQ-401, REQ-402)
- Add rate limiting for reset requests (5 per 15 minutes) (REQ-402)
- Include comprehensive password complexity validation (REQ-403)
- Add session termination on password change (REQ-403)
- Comprehensive test coverage with property-based testing
- Security review completed for all crypto operations

Closes: REQ-401, REQ-402, REQ-403"

git push origin feature/password-reset
```

---

## Advanced Workflow Patterns

### Handling Large Features

For complex features spanning multiple developers and timeframes:

#### Feature Breakdown Strategy

```bash
# 1. Initial Analysis
QNEW "E-commerce checkout system"
QPLAN

# 2. Break into sub-features based on REQ-IDs
QNEW "Payment processing core (REQ-501, REQ-502)"
QNEW "Shopping cart management (REQ-503, REQ-504)"
QNEW "Order fulfillment (REQ-505, REQ-506)"

# 3. Implement incrementally
# Developer A:
QCODE # Payment processing
QCHECK
QGIT

# Developer B:
QCODE # Shopping cart
QCHECK
QGIT

# Developer C:
QCODE # Order fulfillment
QCHECK
QGIT

# 4. Integration and documentation
QDOC "Complete e-commerce system documentation"
QGIT
```

#### Dependency Management

```markdown
# requirements/current.md with dependencies

## REQ-501: Payment Gateway Integration
- Acceptance: Process credit cards via Stripe API
- Dependencies: None (foundation)
- Blocks: REQ-503 (cart needs payment validation)

## REQ-503: Shopping Cart Checkout
- Acceptance: Convert cart to order with payment
- Dependencies: REQ-501 (payment processing required)
- Blocks: REQ-505 (fulfillment needs confirmed orders)

## REQ-505: Order Fulfillment
- Acceptance: Process confirmed orders for shipping
- Dependencies: REQ-503 (needs confirmed orders)
- Blocks: None (terminal feature)
```

### Multi-Environment Development

#### Environment-Specific Agent Behavior

```json
// .claude/settings.development.json
{
  "extends": "./settings.json",
  "permissions": {
    "allow": [
      "Bash(docker-compose up)",
      "Bash(npm run dev)",
      "Bash(yarn start:dev)"
    ]
  },
  "agents": {
    "debugger": {
      "verbosity": "high",
      "includeStackTraces": true
    },
    "test-writer": {
      "generateIntegrationTests": true,
      "mockExternalServices": true
    }
  }
}

// .claude/settings.production.json
{
  "extends": "./settings.json",
  "permissions": {
    "deny": [
      "Bash(rm -rf *)",
      "Bash(docker push *)"
    ],
    "ask": [
      "Bash(kubectl apply *)",
      "Bash(npm run deploy)"
    ]
  },
  "agents": {
    "security-reviewer": {
      "strictMode": true,
      "requireApproval": true
    },
    "release-manager": {
      "requireCodeReview": true,
      "enforceVersioning": true
    }
  }
}
```

#### Environment-Specific Workflows

```bash
# Development workflow
export CLAUDE_ENV=development
QCODE # Enables mock services, detailed debugging
QCHECK # Relaxed security for dev dependencies

# Staging workflow
export CLAUDE_ENV=staging
QCODE # Real integrations, performance testing
QCHECK # Full security review
QUX # User acceptance testing

# Production workflow
export CLAUDE_ENV=production
QCHECK # Strictest security and quality gates
QGIT # Requires additional approvals
```

---

## Multi-Developer Coordination

### Team Workflow Patterns

#### Parallel Development

```bash
# Team Lead: Architecture and requirements
QNEW "User profile management system"
QPLAN # Define overall architecture
# Creates REQ-601, REQ-602, REQ-603

# Developer A: Core profile service
git checkout -b feature/profile-core
QCODE # Implement REQ-601 (profile CRUD)
QCHECK
QGIT

# Developer B: Profile validation
git checkout -b feature/profile-validation
QCODE # Implement REQ-602 (validation rules)
QCHECK
QGIT

# Developer C: Profile API endpoints
git checkout -b feature/profile-api
QCODE # Implement REQ-603 (REST endpoints)
QCHECK
QGIT

# Integration
git checkout main
git merge feature/profile-core
git merge feature/profile-validation
git merge feature/profile-api
QCHECK # Final integration review
QDOC # Complete system documentation
QGIT
```

#### Code Review Integration

```bash
# Developer workflow with PR integration
QCODE # Local development
QCHECK # Local quality review

# Create PR
git push origin feature/user-auth
gh pr create --title "feat: implement user authentication" --body "Implements REQ-301, REQ-302"

# Automated checks in CI
- Run all tests
- PE-Reviewer analysis
- security-reviewer for auth changes
- Code coverage validation

# Human review + agent insights
# Reviewer can use QCHECKF and QCHECKT for targeted reviews

# After approval
QGIT # Final commit to main branch
```

#### Conflict Resolution

```bash
# When merge conflicts occur
git checkout feature/my-feature
git merge main
# Resolve conflicts

# Re-validate after conflict resolution
QCODE # Ensure tests still pass
QCHECK # Re-run quality checks
QGIT # Commit resolution
```

### Knowledge Sharing Patterns

#### Documentation Handoffs

```bash
# Developer A completes feature
QDOC "Document user authentication system"
# Creates comprehensive docs

# Developer B picks up related feature
QPLAN "Analyze authentication for authorization system"
# planner references existing auth docs
# Ensures consistency with previous work
```

#### Cross-Team Integration

```markdown
# requirements/current.md for cross-team feature

## REQ-701: Frontend Integration
- Acceptance: React components consume auth API
- Dependencies: Backend REQ-301, REQ-302 (completed)
- Team: Frontend Team
- Notes: Use existing auth endpoints documented in API_DOCS.md

## REQ-702: Mobile Integration
- Acceptance: Mobile app uses same auth system
- Dependencies: Backend REQ-301, REQ-302 (completed)
- Team: Mobile Team
- Notes: JWT tokens compatible with mobile storage
```

---

## Error Recovery Procedures

### Test Failure Recovery

#### During QCODE Phase

**Scenario**: Tests fail unexpectedly during implementation

```bash
QCODE
# Tests fail with unexpected errors

# debugger agent automatically activates
🔧 DEBUGGER ANALYSIS:

❌ Test Failure: REQ-401 — sends reset email for valid user
   Error: TypeError: Cannot read property 'sendResetEmail' of undefined

🔍 DIAGNOSIS:
- EmailService not properly mocked in test setup
- Constructor dependency injection issue
- Missing beforeEach setup

🛠️ SUGGESTED FIXES:
1. Add proper mock setup in beforeEach
2. Verify EmailService constructor signature
3. Check import paths for EmailService

📝 DEBUGGING STEPS:
```

**Recovery Process:**

```typescript
// Fix test setup
beforeEach(() => {
  // Proper mock setup
  emailService = {
    sendResetEmail: vi.fn().mockResolvedValue(true),
    sendPasswordChangedConfirmation: vi.fn().mockResolvedValue(true)
  };

  service = new PasswordResetService({
    emailService,
    tokenService,
    rateLimitService
  });
});
```

```bash
# Re-run QCODE after fix
QCODE
✅ Tests now pass - implementation complete
```

#### During QCHECK Phase

**Scenario**: Quality gates fail during review

```bash
QCHECK

❌ PE-Reviewer found issues:
1. Function complexity too high in completeReset method
2. Missing edge case tests for expired tokens
3. Inconsistent error handling patterns

❌ security-reviewer found issues:
1. Tokens stored in plain text (security risk)
2. No HTTPS enforcement for reset endpoints
```

**Recovery Process:**

```bash
# Address PE-Reviewer issues
# 1. Reduce complexity by extracting methods
# 2. Add missing tests
# 3. Standardize error handling

# Address security-reviewer issues
# 1. Hash tokens before storage
# 2. Add HTTPS middleware

# Re-run quality checks
QCHECK
✅ All quality gates pass
```

### Build Failure Recovery

#### Continuous Integration Failures

**Scenario**: QGIT succeeds locally but CI fails

```bash
QGIT
✅ Local validation passed

# CI Pipeline fails:
❌ Cross-platform test failures (Windows)
❌ Integration test timeouts
❌ Production build errors
```

**Recovery Process:**

```bash
# 1. Reproduce locally
npm run test:ci # Run tests in CI mode
npm run build:prod # Test production build

# 2. Fix platform-specific issues
# Update vitest.config.js for Windows compatibility
# Adjust timeouts for slower CI environments

# 3. Re-run validation
QCHECK # Local re-validation
QGIT # Re-commit with fixes

# 4. Monitor CI
# Ensure pipeline passes before merging
```

#### Database Migration Failures

**Scenario**: Database schema changes break existing tests

```bash
QCODE
❌ Integration tests fail: table 'reset_tokens' doesn't exist

🔧 DEBUGGER ANALYSIS:
- New password reset feature requires database table
- Migration not created or not run
- Test database schema out of sync
```

**Recovery Process:**

```sql
-- Create migration: 001_add_reset_tokens_table.sql
CREATE TABLE reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  token_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reset_tokens_token_hash ON reset_tokens(token_hash);
CREATE INDEX idx_reset_tokens_expires_at ON reset_tokens(expires_at);
```

```bash
# Run migration
npm run migrate:up

# Update test setup to include migration
# vitest.setup.js
beforeAll(async () => {
  await runMigrations();
});

# Re-run tests
QCODE
✅ Tests pass with database schema
```

### Security Incident Recovery

#### Vulnerability Discovery

**Scenario**: Security vulnerability found in production

```bash
# Emergency security review
URGENT: security-reviewer analyze password reset vulnerability

🛡️ CRITICAL SECURITY ISSUE:
- Reset tokens stored in plain text in database
- Tokens visible in database logs
- Potential for token theft and account takeover

🚨 IMMEDIATE ACTIONS REQUIRED:
1. Rotate all existing reset tokens
2. Implement token hashing
3. Clear database logs containing tokens
4. Deploy hotfix immediately
```

**Emergency Hotfix Process:**

```bash
# 1. Create hotfix branch
git checkout -b hotfix/security-token-hashing

# 2. Implement fix
QNEW "SECURITY: Hash password reset tokens"
QCODE # Implement token hashing
# Skip normal QCHECK for emergency - go straight to security review
"security-reviewer please urgently review token hashing implementation"

# 3. Deploy immediately
QGIT # Emergency commit
git push origin hotfix/security-token-hashing
# Deploy to production immediately

# 4. Post-incident cleanup
QDOC "Document security incident and prevention measures"
```

**Production Data Cleanup:**

```sql
-- Emergency token cleanup
UPDATE reset_tokens
SET token_hash = encode(digest(token_hash, 'sha256'), 'hex')
WHERE created_at < NOW();

-- Clear logs (if applicable)
-- Coordinate with DevOps team
```

---

## Performance Optimization

### Test Performance

#### Slow Test Suite Issues

**Problem**: Test suite takes too long to run

```bash
npm test
# Takes 5+ minutes for 100 tests
```

**Optimization Strategy:**

```typescript
// vitest.config.js - Parallel execution
export default defineConfig({
  test: {
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 2
      }
    },
    // Faster test execution
    testTimeout: 5000,
    hookTimeout: 3000
  }
});
```

```typescript
// Optimize slow tests
describe('PasswordResetService', () => {
  // Group fast unit tests
  describe('validation methods', () => {
    test('validates password complexity', () => {
      // Fast validation logic
    });
  });

  // Separate slow integration tests
  describe('email integration', { timeout: 10000 }, () => {
    test('sends email via external service', async () => {
      // Longer timeout for external calls
    });
  });
});
```

#### Property-Based Test Optimization

**Problem**: Property-based tests are too slow

```typescript
// Slow: Too many test runs
test('tokens are always unique', () => {
  fc.assert(
    fc.property(
      fc.array(fc.string(), { minLength: 100, maxLength: 1000 }), // Too many
      (inputs) => generateTokens(inputs)
    ),
    { numRuns: 1000 } // Too many runs
  );
});

// Optimized: Balanced coverage and speed
test('tokens are always unique', () => {
  fc.assert(
    fc.property(
      fc.array(fc.string(), { minLength: 10, maxLength: 50 }), // Reasonable size
      (inputs) => generateTokens(inputs)
    ),
    { numRuns: 100 } // Sufficient coverage
  );
});
```

### Agent Performance

#### Reducing Agent Analysis Time

**Problem**: QCHECK takes too long for large changes

**Solution**: Incremental analysis

```bash
# Instead of reviewing entire codebase
QCHECK

# Review only changed files
QCHECKF src/auth/password-reset.ts
QCHECKT src/auth/__tests__/password-reset.spec.ts
```

**Caching Agent Results:**

```json
// .claude/cache/analysis-results.json
{
  "src/auth/password-reset.ts": {
    "lastModified": "2024-01-15T10:30:00Z",
    "qualityScore": 95,
    "securityScore": 85,
    "issues": []
  }
}
```

#### Selective Agent Activation

```bash
# For minor changes, skip comprehensive review
git diff --name-only HEAD~1
# Only CSS changes detected

# Skip security-reviewer for non-sensitive changes
QCHECKF # Only function quality review
# Skip QCHECK entirely for CSS-only changes
```

### Workflow Performance

#### Batch Operations

**Problem**: Multiple small features slow down development

**Solution**: Batch related features

```bash
# Instead of separate workflows for each small change
QNEW "Add user avatar upload"
QCODE; QCHECK; QGIT

QNEW "Add user bio field"
QCODE; QCHECK; QGIT

QNEW "Add user preferences"
QCODE; QCHECK; QGIT

# Batch related features
QNEW "Complete user profile enhancements"
# Implement REQ-801 (avatar), REQ-802 (bio), REQ-803 (preferences)
QCODE # All features together
QCHECK # Single comprehensive review
QGIT # Single commit
```

#### Parallel Development Optimization

```bash
# Optimize for team coordination
# Developer A: Core functionality
QNEW "Authentication core (REQ-901, REQ-902)"

# Developer B: API layer (can start immediately)
QNEW "Authentication API (REQ-903, REQ-904)"
# Uses interface contracts from core

# Developer C: Frontend integration (waits for API)
QPLAN "Authentication UI (REQ-905, REQ-906)"
# Plans while waiting for API completion
```

This comprehensive workflow guide provides everything needed to implement the CLAUDE.md system effectively, from basic setup to advanced coordination patterns.