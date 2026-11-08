import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@forge/bridge';
import { DiscoveryContext, ChangeIntent } from '../types';

export function useDiscovery() {
  const [context, setContext] = useState<DiscoveryContext | null>(null);
  const [candidates, setCandidates] = useState<ChangeIntent[]>([]);
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContext = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await invoke('getDiscoveryContext');
      if (res && res.issue) {
        setIsConfigured(res.isConfigured !== false);

        const mappedIntents: ChangeIntent[] = (res.changeIntents || []).map((ci: any) => ({
          id: ci.id || 'demo-intent-aisle7',
          status: ci.discovery_status?.toUpperCase() || 'CANDIDATE',
          label: `${ci.proposed_attribute || 'surface_finish'} change`,
          deployment: ci.deployment_identifier || 'AMR-12',
          zone: ci.zone_name || 'Aisle 7',
          changedAttribute: ci.proposed_attribute || 'surface_finish',
          currentValue: ci.current_value || 'matte_epoxy',
          proposedValue: ci.proposed_value || 'high_gloss_clear_finish',
          sourceReference: ci.source_quoted_text || 'Apply high-gloss clear finish to Aisle 7 next Saturday',
          confidence: 0,
          discoveredAt: ci.created_at || new Date().toISOString(),
          dismissalReason: ci.dismissal_reason,
        }));

        setContext({
          issueKey: res.issue.key,
          plannedWorkSummary: res.issue.summary,
          location: 'Aisle 7 (Facility Alpha)',
          effectiveDate: 'Next Saturday',
          lastChecked: new Date().toISOString(),
          changeIntents: mappedIntents,
        });
        setCandidates(mappedIntents);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load discovery context.');
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
      await invoke('updateAppConfig', {
        siteRegistryPageId,
        defaultFollowupProjectKey,
      });
      await loadContext();
    } catch (err: any) {
      setError(err?.message || 'Failed to update configuration.');
    } finally {
      setLoading(false);
    }
  }, [loadContext]);

  return {
    context,
    candidates,
    isConfigured,
    loading,
    error,
    refresh: loadContext,
    triggerDiscovery,
    updateConfig,
  };
}
