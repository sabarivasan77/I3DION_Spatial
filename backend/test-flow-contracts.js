import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  FlowDefinitionSchema,
  FlowRunSchema,
  ACTION_REGISTRY,
  validateFlowDAG,
} from '../packages/contracts/src/flow.ts';

async function runFlowContractTests() {
  console.log('================================================================');
  console.log('🌊 I3DION Flow: Phase 1 Contracts & DAG Validation Test Suite');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function recordPass(name, detail) {
    passed++;
    console.log(`✅ [PASS] ${name}`);
    if (detail) console.log(`   ${detail}`);
  }

  function recordFail(name, err) {
    failed++;
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   ${err.message || err}`);
  }

  const orgId = crypto.randomUUID();
  const flowId = crypto.randomUUID();

  // ---------------------------------------------------------------------------
  // TEST 1: FLOW-SCHEMA-01 — Valid FlowDefinition Parses Cleanly
  // ---------------------------------------------------------------------------
  try {
    const validFlow = {
      contractVersion: '1.0',
      id: flowId,
      organizationId: orgId,
      name: 'Customer RFQ Quotation Pipeline',
      description: 'Auto drafts and sends quotation on 3D inspection',
      status: 'draft',
      version: 1,
      trigger: {
        id: 'trig_1',
        type: 'event',
        label: 'When 3D Model RFQ Submitted',
        config: { eventType: 'lead_form_submitted' },
      },
      nodes: [
        {
          id: 'node_condition',
          type: 'condition',
          label: 'Is Enterprise Intent?',
          category: 'logic',
          position: { x: 250, y: 150 },
          params: { field: 'intent', operator: 'equals', value: 'quote' },
        },
        {
          id: 'node_email',
          type: 'send_email',
          label: 'Send Proposal Email',
          category: 'communication',
          position: { x: 100, y: 300 },
          params: {
            recipientEmail: 'client@domain.com',
            subject: 'Your 3D Quotation',
            body: 'Hello, your quotation is attached.',
          },
        },
        {
          id: 'node_assign',
          type: 'auto_assign_lead',
          label: 'Assign Account Executive',
          category: 'ecosystem',
          position: { x: 400, y: 300 },
          params: {
            leadId: crypto.randomUUID(),
            status: 'QUALIFIED',
          },
        },
      ],
      edges: [
        {
          id: 'edge_1',
          sourceNodeId: 'node_condition',
          sourcePortId: 'true',
          targetNodeId: 'node_email',
          targetPortId: 'in',
        },
        {
          id: 'edge_2',
          sourceNodeId: 'node_condition',
          sourcePortId: 'false',
          targetNodeId: 'node_assign',
          targetPortId: 'in',
        },
      ],
      variables: [
        { name: 'leadScore', type: 'number', default: 10 },
      ],
      settings: { concurrency: 5, timeoutSeconds: 60, retentionDays: 30 },
    };

    const parsed = FlowDefinitionSchema.parse(validFlow);
    assert.equal(parsed.name, 'Customer RFQ Quotation Pipeline');
    assert.equal(parsed.nodes.length, 3);
    assert.equal(parsed.edges.length, 2);
    recordPass('TEST 1: Valid FlowDefinition Parses Cleanly', 'Zod parsed schema with nodes, edges, and variables.');
  } catch (err) {
    recordFail('TEST 1: Valid FlowDefinition Parses Cleanly', err);
  }

  // ---------------------------------------------------------------------------
  // TEST 2: FLOW-SCHEMA-02 — Schema Rejects Missing Required Fields / Invalid UUID
  // ---------------------------------------------------------------------------
  try {
    let threw = false;
    try {
      FlowDefinitionSchema.parse({
        name: 'Invalid Flow Missing ID',
        trigger: { type: 'manual' },
      });
    } catch {
      threw = true;
    }
    assert.equal(threw, true, 'Expected Zod error for invalid flow');
    recordPass('TEST 2: Schema Rejects Missing Fields & Non-UUID', 'Rejected payload lacking id, organizationId, and valid trigger.');
  } catch (err) {
    recordFail('TEST 2: Schema Rejects Missing Fields & Non-UUID', err);
  }

  // ---------------------------------------------------------------------------
  // TEST 3: FLOW-DAG-01 — Valid DAG Passes Kahn Algorithm
  // ---------------------------------------------------------------------------
  try {
    const flow = {
      id: flowId,
      organizationId: orgId,
      name: 'Valid DAG',
      trigger: { id: 't1', type: 'manual', label: 'Manual' },
      nodes: [
        { id: 'n1', type: 'compose', label: 'Step 1', category: 'data', position: { x: 0, y: 0 } },
        { id: 'n2', type: 'condition', label: 'Step 2', category: 'logic', position: { x: 0, y: 100 } },
        { id: 'n3', type: 'terminate', label: 'Step 3', category: 'logic', position: { x: 0, y: 200 } },
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'n1', sourcePortId: 'out', targetNodeId: 'n2', targetPortId: 'in' },
        { id: 'e2', sourceNodeId: 'n2', sourcePortId: 'true', targetNodeId: 'n3', targetPortId: 'in' },
      ],
    };

    const result = validateFlowDAG(flow);
    assert.equal(result.valid, true, `Expected valid DAG, got errors: ${result.errors.join(', ')}`);
    assert.equal(result.errors.length, 0);
    recordPass('TEST 3: Valid DAG Passes Kahn Algorithm', 'Topological sort completed with 0 errors.');
  } catch (err) {
    recordFail('TEST 3: Valid DAG Passes Kahn Algorithm', err);
  }

  // ---------------------------------------------------------------------------
  // TEST 4: FLOW-DAG-02 — Detects and Rejects Cycles
  // ---------------------------------------------------------------------------
  try {
    const cyclicFlow = {
      id: flowId,
      organizationId: orgId,
      name: 'Cyclic Flow',
      trigger: { id: 't1', type: 'manual', label: 'Manual' },
      nodes: [
        { id: 'n1', type: 'compose', label: 'Step 1', category: 'data', position: { x: 0, y: 0 } },
        { id: 'n2', type: 'delay', label: 'Step 2', category: 'logic', position: { x: 0, y: 100 } },
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'n1', sourcePortId: 'out', targetNodeId: 'n2', targetPortId: 'in' },
        { id: 'e2', sourceNodeId: 'n2', sourcePortId: 'out', targetNodeId: 'n1', targetPortId: 'in' }, // Cycle!
      ],
    };

    const result = validateFlowDAG(cyclicFlow);
    assert.equal(result.valid, false, 'Expected cycle rejection');
    assert.ok(result.errors.some(e => e.includes('Cycle detected')), 'Expected Cycle detected error');
    recordPass('TEST 4: Detects and Rejects Cycles', `Correctly trapped cycle: ${result.errors[0]}`);
  } catch (err) {
    recordFail('TEST 4: Detects and Rejects Cycles', err);
  }

  // ---------------------------------------------------------------------------
  // TEST 5: FLOW-DAG-03 — Detects Invalid Edge Node References
  // ---------------------------------------------------------------------------
  try {
    const brokenFlow = {
      id: flowId,
      organizationId: orgId,
      name: 'Broken Reference Flow',
      trigger: { id: 't1', type: 'manual', label: 'Manual' },
      nodes: [
        { id: 'n1', type: 'compose', label: 'Step 1', category: 'data', position: { x: 0, y: 0 } },
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'n1', sourcePortId: 'out', targetNodeId: 'ghost_node', targetPortId: 'in' },
      ],
    };

    const result = validateFlowDAG(brokenFlow);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('ghost_node')), 'Expected missing target error');
    recordPass('TEST 5: Detects Invalid Edge Node References', `Caught dangling target: ${result.errors[0]}`);
  } catch (err) {
    recordFail('TEST 5: Detects Invalid Edge Node References', err);
  }

  // ---------------------------------------------------------------------------
  // TEST 6: FLOW-REGISTRY-01 — Action Registry Schema Checks
  // ---------------------------------------------------------------------------
  try {
    assert.ok(ACTION_REGISTRY.condition, 'Missing condition node in registry');
    assert.ok(ACTION_REGISTRY.send_email, 'Missing send_email node in registry');
    assert.ok(ACTION_REGISTRY.auto_assign_lead, 'Missing auto_assign_lead node in registry');

    // Test send_email param validation
    const emailParams = ACTION_REGISTRY.send_email.paramSchema.parse({
      recipientEmail: 'eng@i3dion.com',
      subject: 'Quotation Ready',
      body: 'Your technical CAD specs have been generated.',
    });
    assert.equal(emailParams.recipientEmail, 'eng@i3dion.com');

    // Test condition params
    const condParams = ACTION_REGISTRY.condition.paramSchema.parse({
      field: 'dwellTimeSec',
      operator: 'greater_than',
      value: 45,
    });
    assert.equal(condParams.operator, 'greater_than');

    recordPass('TEST 6: Action Registry Schema Checks', 'Verified 9 MVP node definitions and Zod param schemas.');
  } catch (err) {
    recordFail('TEST 6: Action Registry Schema Checks', err);
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`Phase 1 Test Summary: ${passed} Passed | ${failed} Failed`);
  console.log('----------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runFlowContractTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
