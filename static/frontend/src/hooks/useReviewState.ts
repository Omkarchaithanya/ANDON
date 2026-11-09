import { useState, useCallback } from 'react';
import { invoke } from '@forge/bridge';
import { EvidenceRedline, ReviewPackage } from '../types';

const DEFAULT_REDLINE_DATA: EvidenceRedline = {
  changeIntent: {
    id: 'demo-intent-aisle7',
    status: 'CANDIDATE' as any,
    label: 'surface_finish change',
    deployment: 'AMR-12',
    zone: 'Aisle 7',
    changedAttribute: 'surface_finish',
    currentValue: 'matte_epoxy',
    proposedValue: 'high_gloss_clear_finish',
    sourceReference: 'Confluence Page 10483 rev 3',
    confidence: 0,
    discoveredAt: new Date().toISOString(),
  },
  proposedSource: {
    text: 'Apply high-gloss clear finish to Aisle 7 next Saturday',
    sourceRef: 'FAC-1042',
    version: 1,
    lastChecked: new Date().toISOString(),
    isStale: false,
  },
  commissionedSource: {
    text: 'Observed route/perception results apply to AMR-12, camera configuration C4, Aisle 7, existing matte epoxy finish.',
    sourceRef: 'Confluence Page 10483',
    version: 3,
    lastChecked: new Date().toISOString(),
    isStale: false,
  },
  graphContext: {
    path: [
      { label: 'Facility Site Registry (Page 10482)', type: 'site' },
      { label: 'Zone: Aisle 7', type: 'zone' },
      { label: 'Deployment: AMR-12', type: 'deployment' },
      { label: 'Commissioning Baseline (Page 10483 v3)', type: 'commissioning' },
    ],
    ownerName: 'Lead Robotics Engineer (qm:lead-robotics-eng)',
    ownerEmail: 'lead-robotics-eng@example.com',
  },
};

const DEFAULT_PACKAGE_DATA: ReviewPackage = {
  id: 'demo-rev-001',
  status: 'PROSPECTIVE_COVERAGE_GAP' as any,
  coverageStatus: 'GAP' as any,
  gapExplanation: 'The selected baseline does not establish coverage of the planned high-gloss condition.',
  evidenceSourceRef: 'Confluence Page 10483 rev 3',
  coverageDetails: [
    {
      conditionName: 'surface_finish',
      isCovered: false,
      expectedValue: 'high_gloss_clear_finish',
      actualValue: 'matte_epoxy',
      alternativeEvidence: 'Declared in AMR-12 Commissioning Baseline v3',
    },
  ],
  reviewer: {
    name: 'Lead Robotics Engineer',
    role: 'Robotics Engineering Lead',
    deployment: 'AMR-12',
    zone: 'Aisle 7',
  },
  procedures: [],
  followUp: {
    projectKey: 'ROBOT',
    summary: '[ANDON Review] AMR-12 - surface_finish change in Aisle 7',
    description:
      'Prospective coverage gap identified by ANDON:\n\nWork request (FAC-1042) proposes modification of "surface_finish" to "high_gloss_clear_finish".\n\nBaseline commissioning evidence (Confluence Page 10483 rev 3) does not establish coverage of this condition.',
  },
  changeIntentId: 'demo-intent-aisle7',
};

export function useReviewState() {
  const [redlineData, setRedlineData] = useState<EvidenceRedline | null>(DEFAULT_REDLINE_DATA);
  const [packageData, setPackageData] = useState<ReviewPackage | null>(DEFAULT_PACKAGE_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRedline = useCallback(async (changeIntentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await invoke('getEvidenceRedline', { changeIntentId });
      if (res && res.changeIntent) {
        setRedlineData({
          changeIntent: {
            id: res.changeIntent.id || changeIntentId,
            status: (res.changeIntent.discovery_status || 'CANDIDATE').toUpperCase(),
            label: `${res.changeIntent.proposed_attribute || 'Condition'} change`,
            deployment: res.deployment?.deployment_identifier || 'AMR-12',
            zone: res.zone?.name || 'Aisle 7',
            changedAttribute: res.changeIntent.proposed_attribute || 'surface_finish',
            currentValue: res.conditions?.[0]?.attribute_value || 'matte_epoxy',
            proposedValue: res.changeIntent.proposed_value || 'high_gloss_clear_finish',
            sourceReference: res.evidence?.confluence_page_id
              ? `Confluence Page (${res.evidence.confluence_page_id})`
              : 'Commissioning Record',
            confidence: 0,
            discoveredAt: res.changeIntent.created_at || new Date().toISOString(),
          },
          proposedSource: {
            text: res.changeIntent.source_quoted_text || 'Apply high-gloss clear finish to Aisle 7 next Saturday',
            sourceRef: res.changeIntent.jira_issue_key || 'FAC-1042',
            version: 1,
            lastChecked: new Date().toISOString(),
            isStale: false,
          },
          commissionedSource: {
            text:
              res.evidence?.source_quoted_text ||
              'Observed route/perception results apply to AMR-12, camera configuration C4, Aisle 7, existing matte epoxy finish.',
            sourceRef: res.evidence?.confluence_page_id
              ? `Confluence Page ${res.evidence.confluence_page_id}`
              : 'AMR-12 Commissioning Baseline & ODD Declaration',
            version: res.evidence?.confluence_page_version || 3,
            lastChecked: new Date().toISOString(),
            isStale: false,
          },
          graphContext: {
            path: res.graphContext?.path || DEFAULT_REDLINE_DATA.graphContext.path,
            ownerName: res.graphContext?.ownerAccountId || 'Lead Robotics Engineer (qm:lead-robotics-eng)',
            ownerEmail: res.graphContext?.ownerAccountId ? `${res.graphContext.ownerAccountId}` : '',
          },
        });
      } else {
        setRedlineData(DEFAULT_REDLINE_DATA);
      }
    } catch (_err: any) {
      setRedlineData(DEFAULT_REDLINE_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmCandidate = useCallback(
    async (
      changeIntentId: string,
      deploymentId: string,
      attribute: string,
      value: string
    ): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const res: any = await invoke('confirmRelationship', {
          changeIntentId,
          deploymentId,
          confirmedAttribute: attribute,
          confirmedValue: value,
        });
        return res?.reviewDecisionId || res?.id || res?.data?.id || res?.data?.reviewDecisionId || 'demo-rev-001';
      } catch (err: any) {
        setError(err?.message || 'Failed to confirm relationship.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const dismissCandidate = useCallback(async (changeIntentId: string, reason: string) => {
    setLoading(true);
    setError(null);
    try {
      await invoke('dismissRelationship', { changeIntentId, reason });
    } catch (err: any) {
      setError(err?.message || 'Failed to dismiss relationship.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReviewPackage = useCallback(async (reviewDecisionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await invoke('getReviewPackage', { reviewDecisionId });
      if (res && res.reviewDecision) {
        const coverageDetail = res.coverageDetail || {};
        const unmatched = coverageDetail.unmatched_conditions || [];
        const matched = coverageDetail.matched_conditions || [];

        const details = [
          ...unmatched.map((u: any) => ({
            conditionName: u.attribute || 'surface_finish',
            isCovered: false,
            expectedValue: u.expected || 'high_gloss_clear_finish',
            actualValue: u.actual || 'matte_epoxy',
          })),
          ...matched.map((m: any) => ({
            conditionName: m.attribute || 'Condition',
            isCovered: true,
            expectedValue: m.value || 'Covered value',
            actualValue: m.value || 'Covered value',
          })),
        ];

        setPackageData({
          id: res.reviewDecision.id || reviewDecisionId,
          status: res.reviewDecision.review_status,
          coverageStatus: (res.reviewDecision.coverage_result?.toUpperCase() || 'GAP') as any,
          gapExplanation:
            coverageDetail.explanation ||
            'The selected baseline does not establish coverage of the planned high-gloss condition.',
          evidenceSourceRef: res.evidence?.confluence_page_id
            ? `Confluence Page ${res.evidence.confluence_page_id}`
            : 'AMR-12 Commissioning Baseline & ODD Declaration',
          coverageDetails: details.length > 0 ? details : DEFAULT_PACKAGE_DATA.coverageDetails,
          reviewer: {
            name: res.responsibleReviewer?.displayName || 'Lead Robotics Engineer',
            role: 'Robotics Engineering Lead',
            deployment: res.responsibleReviewer?.deploymentIdentifier || 'AMR-12',
            zone: res.responsibleReviewer?.zoneName || 'Aisle 7',
          },
          procedures: (res.applicableProcedures || []).map((p: any) =>
            typeof p === 'string' ? p : `${p.name}: ${p.description}`
          ),
          followUp: {
            projectKey: res.proposedFollowup?.targetProjectKey || 'ROBOT',
            summary: res.proposedFollowup?.summary || '[ANDON Review] AMR-12 - surface_finish change in Aisle 7',
            description: res.proposedFollowup?.description || '',
          },
          changeIntentId: res.changeIntent?.id || 'demo-intent-aisle7',
          createdIssueKey: res.reviewDecision.followup_jira_issue_key || undefined,
        });
      } else {
        setPackageData(DEFAULT_PACKAGE_DATA);
      }
    } catch (_err: any) {
      setPackageData(DEFAULT_PACKAGE_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  const approveFollowup = useCallback(
    async (
      reviewDecisionId: string,
      projectKey: string,
      summary: string,
      description: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        return await invoke('approveFollowup', {
          reviewDecisionId,
          targetProjectKey: projectKey,
          summary,
          description,
        });
      } catch (err: any) {
        setError(err?.message || 'Failed to approve follow-up task.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    redlineData,
    packageData,
    loading,
    error,
    loadRedline,
    confirmCandidate,
    dismissCandidate,
    loadReviewPackage,
    approveFollowup,
  };
}
