import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@forge/bridge';
import { DiscoveryContext, ChangeIntent } from '../types';

export function useDiscovery() {
  const [context, setContext] = useState<DiscoveryContext | null>(null);
  const [candidates, setCandidates] = useState<ChangeIntent[]>([]);
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContext = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await invoke('getDiscoveryContext');
      if (res && res.issue) {
        setIsConfigured(res.isConfigured !== false);

        const mappedIntents: ChangeIntent[] = (res.changeIntents || []).map((ci: any) => ({
          id: ci.id || '',
          status: ci.discovery_status?.toUpperCase() || 'CANDIDATE',
          label: ci.proposed_attribute ? `${ci.proposed_attribute} change` : 'Unknown condition change',
          deployment: ci.deployment_identifier || 'Unknown',
          zone: ci.zone_name || 'Unknown',
          changedAttribute: ci.proposed_attribute || 'Unknown',
          currentValue: ci.current_value || 'Unknown',
          proposedValue: ci.proposed_value || 'Unknown',
          sourceReference: ci.source_quoted_text || 'No verbatim quote available',
          confidence: 0,
          discoveredAt: ci.created_at || new Date().toISOString(),
          dismissalReason: ci.dismissal_reason,
        }));

        setContext({
          issueKey: res.issue.key,
          plannedWorkSummary: res.issue.summary,
          location: res.location || res.zone || 'Unknown',
          effectiveDate: res.effectiveDate || 'Unknown',
          lastChecked: new Date().toISOString(),
          changeIntents: mappedIntents,
        });
        setCandidates(mappedIntents);
      } else {
        setContext(null);
        setCandidates([]);
        setError('No Jira issue context returned from platform.');
      }
    } catch (err: any) {
      setContext(null);
      setCandidates([]);
      setError(err?.message || 'Failed to load discovery context from Forge platform.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  const triggerDiscovery = useCallback(async () => {
    if (!context?.issueKey) return;
    setLoading(true);
    try {
      await invoke('runDiscovery', { issueId: context.issueKey });
      await loadContext();
    } catch (err: any) {
      setError(err?.message || 'Failed to run discovery.');
    } finally {
      setLoading(false);
    }
  }, [context?.issueKey, loadContext]);

  const updateConfig = useCallback(async (siteRegistryPageId: string, defaultFollowupProjectKey: string) => {
    setLoading(true);
    try {
      await invoke('updateAppConfig', { siteRegistryPageId, defaultFollowupProjectKey });
      setIsConfigured(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to update enterprise configuration.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    context,
    candidates,
    isConfigured,
    loading,
    error,
    loadContext,
    triggerDiscovery,
    updateConfig,
  };
}
