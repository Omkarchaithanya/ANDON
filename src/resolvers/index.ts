/**
 * @module resolvers/index
 * @description Main resolver router mapping Forge Custom UI invoke() calls to backend handlers.
 */

import Resolver from '@forge/resolver';
import {
  handleGetDiscoveryContext,
  handleRunDiscovery,
  handleGetChangeIntent,
} from './discovery.resolver';
import {
  handleConfirmRelationship,
  handleDismissRelationship,
} from './confirmation.resolver';
import {
  handleEvaluateCoverage,
  handleGetEvidenceRedline,
} from './comparison.resolver';
import {
  handleApproveFollowup,
  handleGetReviewPackage,
} from './mutation.resolver';
import {
  handleGetAppConfig,
  handleUpdateAppConfig,
  handleRegisterDeployment,
  handleGetAssessmentHistory,
} from './admin.resolver';

const resolver = new Resolver();

// Discovery
resolver.define('getDiscoveryContext', async (req) => {
  return handleGetDiscoveryContext(req.payload, req.context);
});

resolver.define('runDiscovery', async (req) => {
  return handleRunDiscovery(req.payload, req.context);
});

resolver.define('getChangeIntent', async (req) => {
  return handleGetChangeIntent(req.payload);
});

// Confirmation & Dismissal
resolver.define('confirmRelationship', async (req) => {
  return handleConfirmRelationship(req.payload, req.context);
});

resolver.define('dismissRelationship', async (req) => {
  return handleDismissRelationship(req.payload, req.context);
});

// Comparison & Redline
resolver.define('evaluateCoverage', async (req) => {
  return handleEvaluateCoverage(req.payload, req.context);
});

resolver.define('getEvidenceRedline', async (req) => {
  return handleGetEvidenceRedline(req.payload, req.context);
});

// Follow-up Mutation & Review Package
resolver.define('approveFollowup', async (req) => {
  return handleApproveFollowup(req.payload, req.context);
});

resolver.define('getReviewPackage', async (req) => {
  return handleGetReviewPackage(req.payload, req.context);
});

// Enterprise Configuration & Admin
resolver.define('getAppConfig', async (req) => {
  return handleGetAppConfig(req.payload, req.context);
});

resolver.define('updateAppConfig', async (req) => {
  return handleUpdateAppConfig(req.payload, req.context);
});

resolver.define('registerDeployment', async (req) => {
  return handleRegisterDeployment(req.payload, req.context);
});

resolver.define('getAssessmentHistory', async (req) => {
  return handleGetAssessmentHistory(req.payload, req.context);
});

// Async event processor
resolver.define('processQueueEvent', async (req) => {
  return { processed: true, event: req.payload };
});

export const handler = resolver.getDefinitions();
