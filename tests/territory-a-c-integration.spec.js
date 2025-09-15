/**
 * Territory A + C Integration Test Suite
 *
 * Validates seamless integration between Territory A (Architectural Foundation)
 * and Territory C (Core Principles & Requirements Management) components.
 *
 * REQ-INTEGRATION-001: Territory A + C must work together without conflicts
 * REQ-INTEGRATION-002: Cross-territory utilities must be accessible and functional
 * REQ-INTEGRATION-003: Performance impact must be minimal (<50% overhead)
 */

import { describe, test, expect, beforeEach } from 'vitest';

// Territory A imports
import {
  territoryACore,
  generateId,
  validateInput,
  prepareTerritoryC,
  integrationBridge,
  deepClone,
  retry
} from '../lib/index.js';

// Territory C imports
import { PrinciplesAnalyzer } from './principles-analyzer.js';
import { RequirementsAnalyzer } from './requirements-analyzer.js';

describe('Territory A + C Integration Suite', () => {
  let territoryAInstance;
  let requirementsAnalyzer;
  let principlesAnalyzer;

  beforeEach(async () => {
    // Initialize Territory A
    territoryAInstance = territoryACore;
    await territoryAInstance.initialize();

    // Initialize Territory C components
    requirementsAnalyzer = new RequirementsAnalyzer();

    const sampleClaudeContent = `
### 1 — Before Coding
- **BP‑1 (MUST)** Ask clarifying questions when requirements are ambiguous.
- **BP‑2 (SHOULD)** Draft approach for non‑trivial work.

### 2 — While Coding
- **C‑1 (MUST)** Use TDD with failing tests before implementation.
- **C‑2 (SHOULD)** Prefer small, composable functions.
    `;

    principlesAnalyzer = new PrinciplesAnalyzer(sampleClaudeContent);
  });

  describe('REQ-INTEGRATION-001 — Basic Integration Compatibility', () => {
    test('Territory A + C imports work without conflicts', async () => {
      // Verify Territory A components are available
      expect(territoryACore).toBeDefined();
      expect(generateId).toBeDefined();
      expect(validateInput).toBeDefined();
      expect(prepareTerritoryC).toBeDefined();

      // Verify Territory C components are available
      expect(PrinciplesAnalyzer).toBeDefined();
      expect(RequirementsAnalyzer).toBeDefined();
      expect(principlesAnalyzer).toBeDefined();
      expect(requirementsAnalyzer).toBeDefined();
    });

    test('Territory A core initialization succeeds with Territory C loaded', async () => {
      const result = await territoryACore.initialize();
      expect(result.success).toBe(true);
      expect(territoryACore.isReady()).toBe(true);
    });

    test('Territory C preparation activates successfully', () => {
      const result = prepareTerritoryC();
      expect(result.success).toBe(true);
      expect(result.message).toContain('Territory C connection registered');
    });
  });

  describe('REQ-INTEGRATION-002 — Cross-Territory Utility Access', () => {
    test('Territory C can use Territory A utility functions', () => {
      // Test generateId from Territory A in Territory C context
      const reqId = generateId('territory_c_req');
      expect(reqId).toMatch(/^territory_c_req_[a-z0-9]+_[a-z0-9]+$/);

      // Test deep cloning for Territory C data structures
      const requirement = {
        id: 'REQ-001',
        title: 'Test requirement',
        acceptance: ['Must work', 'Must be tested']
      };
      const cloned = deepClone(requirement);
      expect(cloned).toEqual(requirement);
      expect(cloned).not.toBe(requirement); // Different objects
    });

    test('Territory C components integrate with Territory A module system', () => {
      // Register Territory C analyzers as modules in Territory A
      const principlesModuleResult = territoryACore.registerModule(
        'principles-analyzer',
        principlesAnalyzer
      );
      expect(principlesModuleResult.success).toBe(true);

      const requirementsModuleResult = territoryACore.registerModule(
        'requirements-analyzer',
        requirementsAnalyzer
      );
      expect(requirementsModuleResult.success).toBe(true);

      // Verify modules can be retrieved
      const retrievedPrinciplesAnalyzer = territoryACore.getModule('principles-analyzer');
      const retrievedRequirementsAnalyzer = territoryACore.getModule('requirements-analyzer');

      expect(retrievedPrinciplesAnalyzer).toBe(principlesAnalyzer);
      expect(retrievedRequirementsAnalyzer).toBe(requirementsAnalyzer);
    });

    test('Territory A integration bridge handles Territory C events', () => {
      // Prepare Territory C connection
      prepareTerritoryC();

      // Send Territory C data through Territory A integration bridge
      const result = integrationBridge.sendToTerritory('C', 'principles-update', {
        principleId: 'BP-1',
        status: 'validated'
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Event sent to Territory C');
      expect(result.event).toBeDefined();
      expect(result.event.territoryId).toBe('C');
      expect(result.event.eventType).toBe('principles-update');
    });
  });

  describe('REQ-INTEGRATION-003 — Performance Validation', () => {
    test('Combined Territory A + C operations complete within performance thresholds', async () => {
      const startTime = performance.now();

      // Perform 50 combined operations
      for (let i = 0; i < 50; i++) {
        // Territory A operations
        const id = generateId(`test_${i}`);
        const moduleRegistration = territoryACore.registerModule(`module_${i}`, { test: true });

        // Territory C operations
        const principles = principlesAnalyzer.extractAllPrinciples();
        const template = requirementsAnalyzer.generateMinimalTemplate();

        // Integration operations
        integrationBridge.sendToTerritory('C', 'test-event', { iteration: i });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgOperationTime = totalTime / 50;

      // Performance thresholds
      expect(totalTime).toBeLessThan(100); // Total time under 100ms
      expect(avgOperationTime).toBeLessThan(2); // Avg operation under 2ms
    });

    test('Memory usage remains stable during extended Territory A + C operations', async () => {
      // Baseline memory check (if available)
      const initialMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;

      // Perform extended operations
      for (let i = 0; i < 100; i++) {
        let analyzer = new PrinciplesAnalyzer(`### ${i} — Test\n- **T‑${i} (MUST)** Test principle ${i}.`);
        const principles = analyzer.extractAllPrinciples();
        let reqAnalyzer = new RequirementsAnalyzer();
        const template = reqAnalyzer.generateMinimalTemplate();

        // Clean up references
        analyzer = null;
        reqAnalyzer = null;
      }

      // Memory should not have grown excessively
      const finalMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
      const memoryGrowth = finalMemory - initialMemory;

      // Allow for reasonable memory growth (under 10MB for this test)
      if (process.memoryUsage) {
        expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
      } else {
        // If memory usage not available, test passes
        expect(true).toBe(true);
      }
    });
  });

  describe('Realistic Integration Scenarios', () => {
    test('End-to-end workflow: Requirements analysis → Principles validation → Territory A registration', async () => {
      // Step 1: Use Territory C to analyze requirements
      const mockRequirements = `
# Current Requirements

## REQ-001: Implement user authentication
- Acceptance: Users can log in with email/password
- Acceptance: Sessions expire after 24 hours
- Non-Goals: Social media login (future release)
- Notes: Use bcrypt for password hashing

## REQ-002: Create dashboard interface
- Acceptance: Display user statistics
- Acceptance: Responsive design for mobile
      `;

      const requirements = requirementsAnalyzer.parseRequirements(mockRequirements);
      expect(requirements).toHaveLength(2);
      expect(requirements[0].id).toBe('REQ-001');
      expect(requirements[1].id).toBe('REQ-002');

      // Step 2: Use Territory C to validate principles
      const principles = principlesAnalyzer.extractAllPrinciples();
      expect(principles.length).toBeGreaterThan(0);
      const mustPrinciples = principles.filter(p => p.enforcementLevel === 'MUST');
      expect(mustPrinciples.length).toBeGreaterThan(0);

      // Step 3: Use Territory A to register workflow components
      const workflowId = generateId('workflow');
      const workflowData = {
        requirements,
        principles: mustPrinciples,
        status: 'ready'
      };

      const registrationResult = territoryACore.registerModule(workflowId, workflowData);
      expect(registrationResult.success).toBe(true);

      // Step 4: Verify integrated data can be retrieved
      const retrievedWorkflow = territoryACore.getModule(workflowId);
      expect(retrievedWorkflow.requirements).toEqual(requirements);
      expect(retrievedWorkflow.principles).toEqual(mustPrinciples);
      expect(retrievedWorkflow.status).toBe('ready');
    });

    test('Territory C error handling with Territory A resilience', async () => {
      // Test graceful handling of invalid Territory C inputs
      try {
        const invalidAnalyzer = new PrinciplesAnalyzer(null);
        // Should handle gracefully
      } catch (error) {
        // Territory A should remain stable even if Territory C has issues
        expect(territoryACore.isReady()).toBe(true);
      }

      // Territory A utilities should still work
      const id = generateId('error_recovery_test');
      expect(id).toMatch(/^error_recovery_test_[a-z0-9]+_[a-z0-9]+$/);

      // Integration bridge should still be functional
      const status = integrationBridge.getStatus();
      expect(status).toBeDefined();
      expect(status.isActive).toBeDefined();
    });

    test('Concurrent Territory A + C operations maintain data integrity', async () => {
      // Simulate concurrent operations that might occur in real usage
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          new Promise(async (resolve) => {
            // Territory A operations
            const moduleId = generateId(`concurrent_${i}`);
            const registrationResult = territoryACore.registerModule(moduleId, { data: `test_${i}` });

            // Territory C operations
            const reqAnalyzer = new RequirementsAnalyzer();
            const template = reqAnalyzer.generateMinimalTemplate();

            // Integration operations
            prepareTerritoryC();

            resolve({
              moduleId,
              registrationSuccess: registrationResult.success,
              templateGenerated: template.includes('REQ-101')
            });
          })
        );
      }

      const results = await Promise.all(promises);

      // Verify all operations completed successfully
      results.forEach((result, index) => {
        expect(result.registrationSuccess).toBe(true);
        expect(result.templateGenerated).toBe(true);
        expect(result.moduleId).toMatch(/^concurrent_\d+_[a-z0-9]+_[a-z0-9]+$/);

        // Verify module was actually registered
        const retrievedModule = territoryACore.getModule(result.moduleId);
        expect(retrievedModule).toBeDefined();
        expect(retrievedModule.data).toBe(`test_${index}`);
      });
    });
  });

  describe('Integration Status Reporting', () => {
    test('Integration health check reports Territory A + C status', () => {
      prepareTerritoryC();

      const territoryAStatus = {
        core: territoryACore.isReady(),
        modules: territoryACore.modules?.size || 0,
        config: territoryACore.getConfig()
      };

      const integrationStatus = integrationBridge.getStatus();

      const healthCheck = {
        territoryA: territoryAStatus,
        territoryC: {
          principlesAnalyzer: principlesAnalyzer !== null,
          requirementsAnalyzer: requirementsAnalyzer !== null
        },
        integration: integrationStatus,
        overall: territoryAStatus.core && integrationStatus.activeConnections > 0
      };

      expect(healthCheck.territoryA.core).toBe(true);
      expect(healthCheck.territoryC.principlesAnalyzer).toBe(true);
      expect(healthCheck.territoryC.requirementsAnalyzer).toBe(true);
      expect(healthCheck.integration.activeConnections).toBeGreaterThan(0);
      expect(healthCheck.overall).toBe(true);
    });
  });
});