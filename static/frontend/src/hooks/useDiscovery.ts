import { useState, useEffect, useCallback } from 'react';
import { invokeWithTimeout } from './useResolver';
import { DiscoveryContext, ChangeIntent, PipelineTracePayload } from '../types';

export function useDiscovery() {
  const [context, setContext] = useState<DiscoveryContext | null>(null);
  const [candidates, setCandidates] = useState<ChangeIntent[]>([]);
  const [pipelineTrace, setPipelineTrace] = useState<PipelineTracePayload | null>(null);
  const [registeredZones, setRegisteredZones] = useState<any[]>([]);
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jiraStatus, setJiraStatus] = useState<'Verified' | 'Failed' | 'Pending'>('Pending');
  const [confluenceStatus, setConfluenceStatus] = useState<'Verified' | 'Failed' | 'Pending'>('Pending');
  const [graphStatus, setGraphStatus] = useState<'Verified' | 'Failed' | 'Pending'>('Pending');

  const loadContext = useCallback(async (activeTraceReason?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await invokeWithTimeout('getDiscoveryContext');
      if (res && res.issue) {
        setIsConfigured(res.isConfigured !== false);
        setJiraStatus('Verified');
        setConfluenceStatus(res.confluenceError ? 'Failed' : (res.isConfigured ? 'Verified' : 'Failed'));
        setGraphStatus(res.graphError ? 'Failed' : 'Verified');

        // Fetch registered zones from site registry
        try {
          const regRes: any = await invokeWithTimeout('getSiteRegistry');
          if (regRes && Array.isArray(regRes.rows)) {
            setRegisteredZones(regRes.rows);
          } else {
            setRegisteredZones([]);
          }
        } catch {
          setRegisteredZones([]);
        }

        const reasonSentence =
          activeTraceReason ||
          res.graphError ||
          (!res.isConfigured ? 'Site registry unconfigured in administration.' : 'No physical operating-assumption candidate confirmed for this work request.');

        const mappedIntents: ChangeIntent[] = (res.changeIntents || []).map((ci: any) => {
          const zoneVal = ci.zoneName || ci.zone_name;
          const depVal = ci.deploymentIdentifier || ci.deployment_identifier;
          const currVal = ci.currentValue || ci.current_value;

          return {
            id: ci.id || '',
            status: ci.discovery_status?.toUpperCase() || 'UNKNOWN',
            label: ci.proposed_attribute ? `${ci.proposed_attribute} change` : 'Condition modification',
            deployment: depVal || 'Not loaded',
            deploymentIdentifier: depVal || 'Not loaded',
            zone: zoneVal || 'Not loaded',
            zoneName: zoneVal || 'Not loaded',
            changedAttribute: ci.proposed_attribute || 'Not loaded',
            currentValue: currVal || 'Not loaded',
            proposedValue: ci.proposed_value || 'Not loaded',
            sourceReference: ci.source_quoted_text || '',
            confidence: 0,
            discoveredAt: ci.created_at || new Date().toISOString(),
            dismissalReason: ci.dismissal_reason,
            pipelineReason: reasonSentence,
          };
        });

        setContext({
          issueKey: res.issue.key,
          plannedWorkSummary: res.issue.summary || '',
          location: res.location || 'Not loaded',
          effectiveDate: res.effectiveDate || 'Not loaded',
          lastChecked: new Date().toISOString(),
          changeIntents: mappedIntents,
        });
        setCandidates(mappedIntents);
      } else {
        setContext(null);
        setCandidates([]);
        setJiraStatus('Failed');
        setConfluenceStatus('Failed');
        setGraphStatus('Failed');
        setError('No Jira issue context returned from platform.');
      }
    } catch (err: any) {
      setContext(null);
      setCandidates([]);
      setJiraStatus('Failed');
      setConfluenceStatus('Failed');
      setGraphStatus('Failed');
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
      const traceResult: any = await invokeWithTimeout('runDiscovery', { issueId: context.issueKey });
      if (traceResult) {
        setPipelineTrace(traceResult);
        if (traceResult.status === 'UNKNOWN' && traceResult.reason) {
          setError(traceResult.reason);
        }
      }
      await loadContext(traceResult?.reason);
    } catch (err: any) {
      setError(err?.message || 'Failed to run discovery.');
    } finally {
      setLoading(false);
    }
  }, [context?.issueKey, loadContext]);

  const updateConfig = useCallback(async (siteRegistryPageId: string, defaultFollowupProjectKey: string) => {
    setLoading(true);
    try {
      await invokeWithTimeout('updateAppConfig', { siteRegistryPageId, defaultFollowupProjectKey });
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
    pipelineTrace,
    registeredZones,
    isConfigured,
    loading,
    error,
    jiraStatus,
    confluenceStatus,
    graphStatus,
    loadContext,
    triggerDiscovery,
    updateConfig,
  };
}
