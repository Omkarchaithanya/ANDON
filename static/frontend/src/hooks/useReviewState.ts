import { useState, useCallback } from 'react';
import { invoke } from '@forge/bridge';
import { EvidenceRedline, ReviewPackage } from '../types';

export function useReviewState() {
  const [redlineData, setRedlineData] = useState<EvidenceRedline | null>(null);
  const [packageData, setPackageData] = useState<ReviewPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRedline = useCallback(async (changeIntentId: string) => {
    if (!changeIntentId) {
      setError('No Change Intent ID provided.');
      setRedlineData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res: any = await invoke('getEvidenceRedline', { changeIntentId });
      if (res && res.changeIntent) {
        setRedlineData({
          changeIntent: {
            id: res.changeIntent.id || changeIntentId,
            status: (res.changeIntent.discovery_status || 'CANDIDATE').toUpperCase(),
            label: res.changeIntent.proposed_attribute
              ? `${res.changeIntent.proposed_attribute} change`
              : 'Unknown condition change',
            deployment: res.deployment?.deployment_identifier || 'Unknown',
            zone: res.zone?.name || 'Unknown',
            changedAttribute: res.changeIntent.proposed_attribute || 'Unknown',
            currentValue: res.conditions?.[0]?.attribute_value || 'Unknown',
            proposedValue: res.changeIntent.proposed_value || 'Unknown',
            sourceReference: res.evidence?.confluence_page_id
              ? `Confluence Page (${res.evidence.confluence_page_id})`
              : 'Unknown Record',
            confidence: 0,
            discoveredAt: res.changeIntent.created_at || new Date().toISOString(),
          },
          proposedSource: {
            text: res.changeIntent.source_quoted_text || 'No verbatim quote recorded',
            sourceRef: res.changeIntent.jira_issue_key || 'Unknown Issue',
            version: 1,
            lastChecked: new Date().toISOString(),
            isStale: false,
          },
          commissionedSource: {
            text: res.evidence?.source_quoted_text || 'No baseline quote available',
            sourceRef: res.evidence?.confluence_page_id
              ? `Confluence Page ${res.evidence.confluence_page_id}`
              : 'Unknown Commissioning Document',
            version: res.evidence?.confluence_page_version || 1,
            lastChecked: new Date().toISOString(),
            isStale: false,
          },
          graphContext: {
            path: res.graphContext?.path || [],
            ownerName: res.graphContext?.ownerAccountId || 'Unknown Owner',
            ownerEmail: res.graphContext?.ownerAccountId || '',
          },
        });
      } else {
        setRedlineData(null);
        setError('No redline evidence returned for this candidate.');
      }
    } catch (err: any) {
      setRedlineData(null);
      setError(err?.message || 'Failed to load redline data from platform.');
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
        const reviewDecisionId =
          res?.reviewDecisionId || res?.id || res?.data?.id || res?.data?.reviewDecisionId;
        if (!reviewDecisionId) {
          throw new Error('Platform did not return a valid Review Decision ID upon confirmation.');
        }
        return reviewDecisionId;
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
    if (!reviewDecisionId) {
      setError('No Review Decision ID provided.');
      setPackageData(null);
      return;
    }
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
            conditionName: u.attribute || 'Unknown',
            isCovered: false,
            expectedValue: u.expected || 'Unknown',
            actualValue: u.actual || 'Unknown',
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
          coverageStatus: (res.reviewDecision.coverage_result?.toUpperCase() || 'UNKNOWN') as any,
          gapExplanation:
            coverageDetail.explanation ||
            'The selected baseline does not establish coverage of the planned condition.',
          evidenceSourceRef: res.evidence?.confluence_page_id
            ? `Confluence Page ${res.evidence.confluence_page_id}`
            : 'Unknown Baseline Document',
          coverageDetails: details,
          reviewer: {
            name: res.responsibleReviewer?.displayName || 'Unknown Reviewer',
            role: 'Robotics Engineering Lead',
            deployment: res.responsibleReviewer?.deploymentIdentifier || 'Unknown',
            zone: res.responsibleReviewer?.zoneName || 'Unknown',
          },
          procedures: (res.applicableProcedures || []).map((p: any) =>
            typeof p === 'string' ? p : `${p.name}: ${p.description}`
          ),
          followUp: {
            projectKey: res.proposedFollowup?.targetProjectKey || '',
            summary: res.proposedFollowup?.summary || '',
            description: res.proposedFollowup?.description || '',
          },
          changeIntentId: res.changeIntent?.id || '',
          createdIssueKey: res.reviewDecision.followup_jira_issue_key || undefined,
        });
      } else {
        setPackageData(null);
        setError('No review package data returned.');
      }
    } catch (err: any) {
      setPackageData(null);
      setError(err?.message || 'Failed to load review package.');
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
