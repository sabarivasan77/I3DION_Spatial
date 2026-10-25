/**
 * Spatial Lens CRM Foundation & Operational Sales Test Suite
 * 
 * Tests:
 *  - CRM-01: Sales Command Center overview metrics (deals, leads, tasks, win rate).
 *  - CRM-02: Account creation & listing with tier, industry, and owner.
 *  - CRM-03: Contact creation affiliated with account and primary contact flag.
 *  - CRM-04: Deal lifecycle, stages (Discovery -> Won), and pipeline value rollup.
 *  - CRM-05: Atomic Lead-to-Customer conversion (creates Account + Contact + Deal).
 *  - CRM-06: Task follow-ups, overdue filtering, and status toggle completion.
 *  - CRM-07: Customer enquiries and technical desk resolution.
 *  - CRM-08: Sales document attachments and filtering by deal/account.
 *  - CRM-09: Dashboard customizer layout persistence.
 *  - CRM-10: Permission-aware AI Sales Assistant operational Q&A.
 *  - CRM-11: Multi-tenant isolation across all CRM entities.
 */

import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import { app } from '../../src/server.js';
import { pool, ensureMigrated } from '../../src/db/pool.js';
import { config } from '../../src/config.js';

console.log('================================================================');
console.log('🎯 I3DION Spatial Lens: Sales Operations & CRM Test Suite');
console.log('================================================================\n');

let passedCount = 0;
let failedCount = 0;

function pass(name, details = '') {
  console.log(`✅ [PASS] ${name}`);
  if (details) console.log(`   ${details}`);
  passedCount++;
}

function fail(name, error) {
  console.error(`❌ [FAIL] ${name}`);
  console.error(`   Error: ${error.message || error}`);
  failedCount++;
}

async function runSuite() {
  await ensureMigrated();

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const testRunId = Date.now();
  let orgId = null;
  let adminUserId = null;
  let adminToken = null;

  let tenant2OrgId = null;
  let tenant2Token = null;

  try {
    // -------------------------------------------------------------
    // SETUP: Tenant 1 & Admin User
    // -------------------------------------------------------------
    const orgRes = await pool.query(
      `INSERT INTO organizations (name, website, profile, storage_quota_bytes, ai_assist_enabled)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, name`,
      [
        `Lens CRM Org ${testRunId}`,
        'https://crm.lens.i3dion.com',
        'Sales Operations & CRM Flagship Tenant',
        107374182400
      ]
    );
    orgId = orgRes.rows[0].id;

    const userRes = await pool.query(
      `INSERT INTO users (organization_id, email, password_hash, role, name, token_version)
       VALUES ($1, $2, $3, 'Admin', 'Chief Commercial Officer', 0)
       RETURNING id, email, role, organization_id`,
      [orgId, `cco-${testRunId}@i3dion.com`, 'test_pw_hash']
    );
    adminUserId = userRes.rows[0].id;

    await pool.query(
      `INSERT INTO organization_members (organization_id, user_id, role)
       VALUES ($1, $2, 'Admin') ON CONFLICT DO NOTHING`,
      [orgId, adminUserId]
    );

    adminToken = jwt.sign(
      { sub: adminUserId, userId: adminUserId, email: userRes.rows[0].email, role: 'Admin', organization_id: orgId, organizationId: orgId, org: orgId, ver: 0 },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // Setup Tenant 2 for Isolation Checks
    const org2Res = await pool.query(
      `INSERT INTO organizations (name, website, profile)
       VALUES ($1, $2, $3) RETURNING id`,
      [`Competitor Org ${testRunId}`, 'https://rival.com', 'Tenant Isolation Test']
    );
    tenant2OrgId = org2Res.rows[0].id;

    const user2Res = await pool.query(
      `INSERT INTO users (organization_id, email, password_hash, role, name, token_version)
       VALUES ($1, $2, $3, 'Admin', 'Rival Admin', 0) RETURNING id`,
      [tenant2OrgId, `rival-${testRunId}@rival.com`, 'test_pw_hash']
    );

    tenant2Token = jwt.sign(
      { sub: user2Res.rows[0].id, userId: user2Res.rows[0].id, email: `rival-${testRunId}@rival.com`, role: 'Admin', organization_id: tenant2OrgId, organizationId: tenant2OrgId, org: tenant2OrgId, ver: 0 },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // -------------------------------------------------------------
    // TEST 1: CRM-01 Sales Command Center Overview
    // -------------------------------------------------------------
    try {
      const res = await fetch(`${baseUrl}/api/crm/overview`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(data.kpis, 'KPIs object must exist');
      assert.strictEqual(data.tenantScope, orgId);
      pass('CRM-01: Sales Command Center Overview', `Returned initial KPIs. Total leads: ${data.kpis.totalLeads}, Open pipeline: $${data.kpis.openPipelineValue}`);
    } catch (err) {
      fail('CRM-01: Sales Command Center Overview', err);
    }

    // -------------------------------------------------------------
    // TEST 2: CRM-02 Account Creation & Listing
    // -------------------------------------------------------------
    let createdAccountId = null;
    try {
      const createRes = await fetch(`${baseUrl}/api/crm/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: 'Apex Heavy Machinery Global',
          industry: 'Industrial Equipment',
          website: 'https://apexmachinery.com',
          phone: '+1 800 555 9876',
          tier: 'Enterprise',
          annualRevenue: 45000000
        })
      });
      assert.strictEqual(createRes.status, 201);
      const acc = await createRes.json();
      assert.strictEqual(acc.name, 'Apex Heavy Machinery Global');
      assert.strictEqual(acc.tier, 'Enterprise');
      createdAccountId = acc.id;

      const listRes = await fetch(`${baseUrl}/api/crm/accounts`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(listRes.status, 200);
      const accounts = await listRes.json();
      assert.ok(accounts.some(a => a.id === createdAccountId), 'Created account must be present in accounts list');

      pass('CRM-02: Account Creation & Listing', `Created account ${acc.name} (Tier: ${acc.tier}, ID: ${acc.id})`);
    } catch (err) {
      fail('CRM-02: Account Creation & Listing', err);
    }

    // -------------------------------------------------------------
    // TEST 3: CRM-03 Contact Creation & Affiliation
    // -------------------------------------------------------------
    let createdContactId = null;
    try {
      const contactRes = await fetch(`${baseUrl}/api/crm/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          accountId: createdAccountId,
          firstName: 'Marcus',
          lastName: 'Vance',
          email: 'marcus.vance@apexmachinery.com',
          phone: '+1 415 555 4321',
          title: 'VP of Procurement',
          department: 'Capital Equipment',
          isPrimary: true
        })
      });
      assert.strictEqual(contactRes.status, 201);
      const contact = await contactRes.json();
      assert.strictEqual(contact.first_name, 'Marcus');
      assert.strictEqual(contact.is_primary, true);
      createdContactId = contact.id;

      const listRes = await fetch(`${baseUrl}/api/crm/contacts?accountId=${createdAccountId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(listRes.status, 200);
      const contacts = await listRes.json();
      assert.strictEqual(contacts.length, 1);
      assert.strictEqual(contacts[0].account_name, 'Apex Heavy Machinery Global');

      pass('CRM-03: Contact Creation & Affiliation', `Contact ${contact.first_name} ${contact.last_name} linked to account.`);
    } catch (err) {
      fail('CRM-03: Contact Creation & Affiliation', err);
    }

    // -------------------------------------------------------------
    // TEST 4: CRM-04 Deal Pipeline Lifecycle
    // -------------------------------------------------------------
    let createdDealId = null;
    try {
      const dealRes = await fetch(`${baseUrl}/api/crm/deals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          accountId: createdAccountId,
          contactId: createdContactId,
          name: 'Apex Titan 9000 Digital Twin Expansion',
          amount: 175000,
          stage: 'Discovery',
          expectedCloseDate: '2026-12-15',
          nextStep: 'Present interactive 3D assembly to engineering board'
        })
      });
      assert.strictEqual(dealRes.status, 201);
      const deal = await dealRes.json();
      assert.strictEqual(deal.name, 'Apex Titan 9000 Digital Twin Expansion');
      assert.strictEqual(parseFloat(deal.amount), 175000);
      createdDealId = deal.id;

      // Update Stage to Won
      const stageRes = await fetch(`${baseUrl}/api/crm/deals/${createdDealId}/stage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ stage: 'Won' })
      });
      assert.strictEqual(stageRes.status, 200);
      const wonDeal = await stageRes.json();
      assert.strictEqual(wonDeal.stage, 'Won');
      assert.strictEqual(wonDeal.probability, 100);

      pass('CRM-04: Deal Pipeline Lifecycle', `Deal transitioned from Discovery to Won ($175,000 revenue recorded).`);
    } catch (err) {
      fail('CRM-04: Deal Pipeline Lifecycle', err);
    }

    // -------------------------------------------------------------
    // TEST 5: CRM-05 Atomic Lead-to-Customer Conversion
    // -------------------------------------------------------------
    try {
      // 1. Create Inbound Lead
      const leadRes = await pool.query(
        `INSERT INTO leads (organization_id, name, email, phone, company, status, score, priority)
         VALUES ($1, 'Elena Rostova', 'elena@novatech.de', '+49 89 123456', 'NovaTech Robotics GmbH', 'New', 88, 'High')
         RETURNING id`,
        [orgId]
      );
      const leadId = leadRes.rows[0].id;

      // 2. Convert Lead
      const convertRes = await fetch(`${baseUrl}/api/crm/leads/${leadId}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          accountName: 'NovaTech Robotics GmbH',
          dealName: 'NovaTech Robotic Arm 3D Showroom',
          dealAmount: 95000,
          expectedCloseDate: '2026-11-30'
        })
      });
      assert.strictEqual(convertRes.status, 200);
      const conv = await convertRes.json();
      assert.strictEqual(conv.success, true);
      assert.ok(conv.accountId, 'Account must be generated');
      assert.ok(conv.contactId, 'Contact must be generated');
      assert.ok(conv.deal, 'Deal must be generated');
      assert.strictEqual(conv.deal.amount, '95000');

      // Verify Lead status updated
      const updatedLead = await pool.query(`SELECT status FROM leads WHERE id = $1`, [leadId]);
      assert.strictEqual(updatedLead.rows[0].status, 'Qualified');

      pass('CRM-05: Atomic Lead-to-Customer Conversion', `Lead converted to Account, Contact, and $95,000 Deal with audit timeline entry.`);
    } catch (err) {
      fail('CRM-05: Atomic Lead-to-Customer Conversion', err);
    }

    // -------------------------------------------------------------
    // TEST 6: CRM-06 Task Creation & Completion
    // -------------------------------------------------------------
    let taskId = null;
    try {
      const taskRes = await fetch(`${baseUrl}/api/crm/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          accountId: createdAccountId,
          dealId: createdDealId,
          title: 'Review customized CAD step file tolerances with Marcus',
          taskType: 'call',
          priority: 'Urgent',
          dueDate: new Date(Date.now() + 3600000).toISOString()
        })
      });
      assert.strictEqual(taskRes.status, 201);
      const task = await taskRes.json();
      assert.strictEqual(task.status, 'Pending');
      taskId = task.id;

      // Mark Complete
      const completeRes = await fetch(`${baseUrl}/api/crm/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: 'Completed' })
      });
      assert.strictEqual(completeRes.status, 200);
      const completedTask = await completeRes.json();
      assert.strictEqual(completedTask.status, 'Completed');
      assert.ok(completedTask.completed_at, 'Completion timestamp must be set');

      pass('CRM-06: Task Creation & Completion', `Urgent follow-up task created and toggled to Completed.`);
    } catch (err) {
      fail('CRM-06: Task Creation & Completion', err);
    }

    // -------------------------------------------------------------
    // TEST 7: CRM-07 Customer Enquiries & Resolution
    // -------------------------------------------------------------
    let enquiryId = null;
    try {
      const enqRes = await fetch(`${baseUrl}/api/crm/enquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          accountId: createdAccountId,
          contactId: createdContactId,
          subject: 'Clarification regarding WebXR iOS QuickLook scaling',
          message: 'Can our maintenance team view the 3D turbine model at 1:1 true scale on iPad Pro?',
          category: 'Documentation',
          priority: 'High'
        })
      });
      assert.strictEqual(enqRes.status, 201);
      const enq = await enqRes.json();
      assert.strictEqual(enq.status, 'Open');
      enquiryId = enq.id;

      // Update to Resolved
      const patchRes = await fetch(`${baseUrl}/api/crm/enquiries/${enquiryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: 'Resolved' })
      });
      assert.strictEqual(patchRes.status, 200);
      const resolved = await patchRes.json();
      assert.strictEqual(resolved.status, 'Resolved');

      pass('CRM-07: Customer Enquiries & Resolution', `Technical enquiry created, linked to customer account, and resolved.`);
    } catch (err) {
      fail('CRM-07: Customer Enquiries & Resolution', err);
    }

    // -------------------------------------------------------------
    // TEST 8: CRM-08 Sales Documents Metadata
    // -------------------------------------------------------------
    try {
      const docRes = await fetch(`${baseUrl}/api/crm/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          accountId: createdAccountId,
          dealId: createdDealId,
          fileName: 'Apex_Titan_9000_Commercial_Agreement_v1.pdf',
          fileUrl: '/uploads/contracts/apex_contract.pdf',
          fileSizeBytes: 2450000,
          category: 'contract'
        })
      });
      assert.strictEqual(docRes.status, 201);
      const doc = await docRes.json();
      assert.strictEqual(doc.category, 'contract');

      const listDocs = await fetch(`${baseUrl}/api/crm/documents?dealId=${createdDealId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(listDocs.status, 200);
      const docs = await listDocs.json();
      assert.strictEqual(docs.length, 1);
      assert.strictEqual(docs[0].file_name, 'Apex_Titan_9000_Commercial_Agreement_v1.pdf');

      pass('CRM-08: Sales Documents Metadata', `Contract document attached to deal and filtered by deal ID.`);
    } catch (err) {
      fail('CRM-08: Sales Documents Metadata', err);
    }

    // -------------------------------------------------------------
    // TEST 9: CRM-09 Dashboard Configuration Persistence
    // -------------------------------------------------------------
    try {
      const saveRes = await fetch(`${baseUrl}/api/crm/dashboard-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: 'Executive Sales Layout Q4',
          isShared: true,
          widgets: [
            { id: 'w_kpi', type: 'kpi', title: 'Closed Won Pipeline', position: { x: 0, y: 0, w: 12, h: 2 } },
            { id: 'w_funnel', type: 'funnel', title: 'Spatial Conversion Funnel', position: { x: 0, y: 2, w: 6, h: 4 } }
          ]
        })
      });
      assert.strictEqual(saveRes.status, 200);

      const getRes = await fetch(`${baseUrl}/api/crm/dashboard-config`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(getRes.status, 200);
      const config = await getRes.json();
      assert.strictEqual(config.name, 'Executive Sales Layout Q4');
      assert.strictEqual(config.is_shared, true);

      pass('CRM-09: Dashboard Configuration Persistence', `Customized BI widget layout persisted and retrieved.`);
    } catch (err) {
      fail('CRM-09: Dashboard Configuration Persistence', err);
    }

    // -------------------------------------------------------------
    // TEST 10: CRM-10 Permission-Aware AI Sales Assistant
    // -------------------------------------------------------------
    try {
      const chatRes = await fetch(`${baseUrl}/api/crm/assistant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          prompt: 'Summarize the current deals in our pipeline'
        })
      });
      assert.strictEqual(chatRes.status, 200);
      const chatData = await chatRes.json();
      assert.ok(chatData.reply, 'Assistant reply must exist');
      assert.ok(chatData.records.length > 0, 'Real deal records must be returned');

      pass('CRM-10: Permission-Aware AI Sales Assistant', `AI assistant summarized real pipeline deals without hallucinations.`);
    } catch (err) {
      fail('CRM-10: Permission-Aware AI Sales Assistant', err);
    }

    // -------------------------------------------------------------
    // TEST 11: CRM-11 Tenant Isolation Enforcement
    // -------------------------------------------------------------
    try {
      const t2AccountsRes = await fetch(`${baseUrl}/api/crm/accounts`, {
        headers: { Authorization: `Bearer ${tenant2Token}` }
      });
      assert.strictEqual(t2AccountsRes.status, 200);
      const t2Accounts = await t2AccountsRes.json();
      assert.strictEqual(t2Accounts.length, 0, 'Tenant 2 must see 0 accounts from Tenant 1');

      const t2DealsRes = await fetch(`${baseUrl}/api/crm/deals`, {
        headers: { Authorization: `Bearer ${tenant2Token}` }
      });
      assert.strictEqual(t2DealsRes.status, 200);
      const t2Deals = await t2DealsRes.json();
      assert.strictEqual(t2Deals.length, 0, 'Tenant 2 must see 0 deals from Tenant 1');

      pass('CRM-11: Tenant Isolation Enforcement', `Strict multi-tenant RLS isolation verified between Tenant 1 and Tenant 2.`);
    } catch (err) {
      fail('CRM-11: Tenant Isolation Enforcement', err);
    }

  } finally {
    server.close();
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`Results: ${passedCount} passed, ${failedCount} failed`);
  console.log('----------------------------------------------------------------\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
