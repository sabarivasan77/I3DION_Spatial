import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';
import {
  getSalesCommandOverview,
  getAccounts,
  createAccount,
  getContacts,
  createContact,
  getDeals,
  createDeal,
  updateDealStage,
  convertLeadToCustomer,
  getTasks,
  createTask,
  updateTaskStatus,
  getEnquiries,
  createEnquiry,
  updateEnquiryStatus,
  getCrmDocuments,
  createCrmDocument,
  getDashboardConfig,
  saveDashboardConfig,
  answerSalesAssistantQuery
} from '../services/lens/crmService.js';

export const crmRouter = Router();

crmRouter.use(requireAuth);

function resolveOrgId(req) {
  return req.organizationId || req.user?.organizationId || req.user?.organization_id;
}

// 1. Sales Command Center Overview
crmRouter.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const overview = await getSalesCommandOverview(orgId);
    res.json(overview);
  })
);

// 2. Accounts
crmRouter.get(
  '/accounts',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const { search, tier, limit, offset } = req.query;
    const accounts = await getAccounts(orgId, {
      search,
      tier,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    });
    res.json(accounts);
  })
);

crmRouter.post(
  '/accounts',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const account = await createAccount(orgId, { ...req.body, ownerId: req.body.ownerId || req.user?.id });
    res.status(201).json(account);
  })
);

// 3. Contacts
crmRouter.get(
  '/contacts',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const { accountId, search, limit, offset } = req.query;
    const contacts = await getContacts(orgId, {
      accountId,
      search,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    });
    res.json(contacts);
  })
);

crmRouter.post(
  '/contacts',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const contact = await createContact(orgId, req.body);
    res.status(201).json(contact);
  })
);

// 4. Deals & Pipeline
crmRouter.get(
  '/deals',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const { stage, ownerId, search, limit, offset } = req.query;
    const deals = await getDeals(orgId, {
      stage,
      ownerId,
      search,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0
    });
    res.json(deals);
  })
);

crmRouter.post(
  '/deals',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const deal = await createDeal(orgId, { ...req.body, ownerId: req.body.ownerId || req.user?.id });
    res.status(201).json(deal);
  })
);

crmRouter.patch(
  '/deals/:id/stage',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const deal = await updateDealStage(orgId, req.params.id, req.body);
    res.json(deal);
  })
);

// 5. Lead to Customer Conversion
crmRouter.post(
  '/leads/:id/convert',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const result = await convertLeadToCustomer(orgId, req.params.id, req.body);
    res.status(200).json(result);
  })
);

// 6. Tasks & Follow-ups
crmRouter.get(
  '/tasks',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const { status, filter, assignedTo, limit, offset } = req.query;
    const tasks = await getTasks(orgId, {
      status,
      filter,
      assignedTo,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0
    });
    res.json(tasks);
  })
);

crmRouter.post(
  '/tasks',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const task = await createTask(orgId, req.user?.id, req.body);
    res.status(201).json(task);
  })
);

crmRouter.patch(
  '/tasks/:id/status',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const { status } = req.body;
    const task = await updateTaskStatus(orgId, req.params.id, status);
    res.json(task);
  })
);

// 7. Enquiries
crmRouter.get(
  '/enquiries',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const { status, priority, limit, offset } = req.query;
    const enquiries = await getEnquiries(orgId, {
      status,
      priority,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    });
    res.json(enquiries);
  })
);

crmRouter.post(
  '/enquiries',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const enquiry = await createEnquiry(orgId, req.user?.id, req.body);
    res.status(201).json(enquiry);
  })
);

crmRouter.patch(
  '/enquiries/:id',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const enquiry = await updateEnquiryStatus(orgId, req.params.id, req.body);
    res.json(enquiry);
  })
);

// 8. Documents
crmRouter.get(
  '/documents',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const docs = await getCrmDocuments(orgId, req.query);
    res.json(docs);
  })
);

crmRouter.post(
  '/documents',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const doc = await createCrmDocument(orgId, req.user?.id, req.body);
    res.status(201).json(doc);
  })
);

// 9. Dashboard Configuration
crmRouter.get(
  '/dashboard-config',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const config = await getDashboardConfig(orgId, req.user?.id);
    res.json(config);
  })
);

crmRouter.put(
  '/dashboard-config',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const config = await saveDashboardConfig(orgId, req.user?.id, req.body);
    res.json(config);
  })
);

// 10. AI Assistant
crmRouter.post(
  '/assistant/chat',
  asyncHandler(async (req, res) => {
    const orgId = resolveOrgId(req);
    const { prompt } = req.body;
    const answer = await answerSalesAssistantQuery(orgId, req.user, prompt);
    res.json(answer);
  })
);
