/// <reference types="vite/client" />
/**
 * @file dev-bridge.ts
 * @description Localhost development harness for Vite preview.
 *
 * In Atlassian Cloud / Jira Custom UI iframe, Forge automatically injects window.__bridge.
 * When running in local development mode (localhost:5173), this harness prevents
 * @forge/bridge from throwing BridgeAPIError at module load time and supplies
 * mock resolver responses so the UI can be developed and inspected interactively.
 *
 * In production builds (vite build), import.meta.env.DEV is false and this file is inert.
 */

if ((import.meta as any).env?.DEV && typeof window !== 'undefined' && !(window as any).__bridge) {
  (window as any).__isStandaloneDev = true;
  (window as any).__bridge = {
    callBridge: function (action: string, payload: any) {
      if (action === 'getContext') {
        return Promise.resolve({
          accountId: 'dev-user-001',
          displayName: 'Local Dev User',
          siteUrl: 'http://localhost:5173',
          extension: {
            issue: { id: 'FAC-1042', key: 'FAC-1042' },
          },
        });
      }

      if (action === 'invoke') {
        const fn = payload && payload.functionKey;

        // Attempt live invocation through local backend server at port 5174
        return fetch('http://localhost:5174/api/invoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ functionKey: fn, payload: payload?.payload }),
        })
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              console.log(`[ANDON Backend Live Response from :5174] for "${fn}":`, data);
              return data;
            }
            throw new Error(`Server returned HTTP ${res.status}`);
          })
          .catch((err) => {
            console.info(`[ANDON Dev Bridge] Local backend server at :5174 offline (${err?.message}); using in-memory engine.`);
            return fallbackInvoke(fn, payload?.payload);
          });
      }
      return Promise.resolve(null);
    },
  };
}

function fallbackInvoke(fn: string, _payload?: any): Promise<any> {

        if (fn === 'getDiscoveryContext') {
          return Promise.resolve({
            isConfigured: true,
            issue: {
              id: 'FAC-1042',
              key: 'FAC-1042',
              summary: 'Apply high-gloss clear finish to Aisle 7 next Saturday',
              description: 'Scheduled maintenance: resurfacing floor with high-gloss clear sealant.',
            },
            location: 'Aisle 7',
            effectiveDate: 'Next Saturday',
            changeIntents: [
              {
                id: 'intent-aisle7-001',
                discovery_status: 'candidate',
                proposed_attribute: 'surface_finish',
                current_value: 'matte_epoxy',
                proposed_value: 'high_gloss_clear_finish',
                deployment_identifier: 'AMR-12',
                zone_name: 'Aisle 7',
                source_quoted_text: 'Apply high-gloss clear finish to Aisle 7 next Saturday',
                created_at: new Date().toISOString(),
              },
            ],
          });
        }

        if (fn === 'getEvidenceRedline' || fn === 'getComparisonView') {
          return Promise.resolve({
            changeIntent: {
              id: 'intent-aisle7-001',
              discovery_status: 'candidate',
              jira_issue_key: 'FAC-1042',
              jira_issue_summary: 'Apply high-gloss clear finish to Aisle 7 next Saturday',
              proposed_attribute: 'surface_finish',
              current_value: 'matte_epoxy',
              proposed_value: 'high_gloss_clear_finish',
              deployment: 'AMR-12',
              zone: 'Aisle 7',
              source_quoted_text: 'Apply high-gloss clear finish to Aisle 7 next Saturday',
              effective_time_info: 'Next Saturday',
              created_at: new Date().toISOString(),
            },
            proposedSource: {
              sourceRef: 'FAC-1042',
              text: 'Apply high-gloss clear finish to Aisle 7 next Saturday',
            },
            commissionedSource: {
              sourceRef: 'Confluence Page 10483',
              version: 3,
              text: 'Observed route/perception results apply to AMR-12, camera configuration C4, Aisle 7, existing matte epoxy finish.',
            },
            deployment: {
              id: 'dep-amr-12',
              deployment_identifier: 'AMR-12',
              robot_type: 'Industrial Mobile Robot',
              criticality: 'HIGH',
              owner_account_id: 'qm:lead-robotics-eng',
            },
            zone: {
              id: 'zone-aisle-7',
              name: 'Aisle 7',
              zone_type: 'aisle',
            },
            conditions: [
              {
                attribute_name: 'surface_finish',
                attribute_value: 'matte_epoxy',
              },
            ],
            evidence: {
              id: 'ev-comm-01',
              confluence_page_title: 'AMR-12 Commissioning Baseline & ODD Declaration',
              confluence_page_id: '10483',
              confluence_page_version: 3,
              source_quoted_text: 'Observed route/perception results apply to AMR-12, camera configuration C4, Aisle 7, existing matte epoxy finish.',
              declared_scope: {
                conditions: [
                  { attribute_name: 'surface_finish', declared_value: 'matte_epoxy' },
                ],
              },
            },
            graphContext: {
              path: [
                { label: 'Facility Site Registry (Page 10482)', type: 'site' },
                { label: 'Zone: Aisle 7', type: 'zone' },
                { label: 'Deployment: AMR-12', type: 'deployment' },
                { label: 'Commissioning Baseline (Page 10483 v3)', type: 'commissioning' },
              ],
              siteName: 'Facility Alpha',
              zoneName: 'Aisle 7',
              deploymentId: 'AMR-12',
              ownerAccountId: 'qm:lead-robotics-eng',
            },
          });
        }

        if (fn === 'confirmRelationship') {
          return Promise.resolve({
            success: true,
            id: 'decision-rev-001',
            reviewDecisionId: 'decision-rev-001',
            evaluationResult: 'gap',
          });
        }

        if (fn === 'dismissRelationship') {
          return Promise.resolve({ success: true });
        }

        if (fn === 'getReviewPackage') {
          return Promise.resolve({
            reviewDecision: {
              id: 'decision-rev-001',
              review_status: 'confirmed_gap',
              coverage_result: 'gap',
              actor_account_id: 'qm:lead-robotics-eng',
              created_at: new Date().toISOString(),
            },
            changeIntent: {
              id: 'intent-aisle7-001',
              jira_issue_key: 'FAC-1042',
              proposed_attribute: 'surface_finish',
              proposed_value: 'high_gloss_clear_finish',
            },
            deployment: {
              deployment_identifier: 'AMR-12',
              owner_account_id: 'qm:lead-robotics-eng',
            },
            evidence: {
              confluence_page_id: '10483',
              confluence_page_version: 3,
            },
            coverageDetail: {
              result: 'gap',
              explanation: 'The selected baseline does not establish coverage of the planned high-gloss condition.',
              unmatched_conditions: [
                {
                  attribute: 'surface_finish',
                  expected: 'high_gloss_clear_finish',
                  actual: 'matte_epoxy',
                },
              ],
              matched_conditions: [],
            },
            responsibleReviewer: {
              displayName: 'Lead Robotics Engineer (qm:lead-robotics-eng)',
              deploymentIdentifier: 'AMR-12',
              zoneName: 'Aisle 7',
            },
            applicableProcedures: [],
            proposedFollowup: {
              targetProjectKey: 'ROBOT',
              summary: '[ANDON Review] AMR-12 - surface_finish change in Aisle 7',
              description: 'Prospective coverage gap identified by ANDON:\n\nWork request (FAC-1042) proposes modification of "surface_finish" to "high_gloss_clear_finish".\n\nBaseline commissioning evidence (Confluence Page 10483 rev 3) does not establish coverage of this condition.\n\nRequired Actions:\n1. Review the proposed physical change with facilities staff.\n2. Complete revalidation procedures prior to deployment window.',
            },
          });
        }

        if (fn === 'approveFollowup') {
          return Promise.resolve({
            success: true,
            issueKey: 'ROBOT-8821',
            createdIssueKey: 'ROBOT-8821',
            issueId: '10992',
            status: 'created',
            message: 'Successfully created follow-up engineering task ROBOT-8821.',
          });
        }

        if (fn === 'runDiscovery') {
          return Promise.resolve({ success: true, count: 1 });
        }

        if (fn === 'updateAppConfig') {
          return Promise.resolve({ success: true });
        }

        if (fn === 'getAppConfig') {
          return Promise.resolve({
            isConfigured: true,
            siteRegistryPageId: '10482',
            defaultFollowupProjectKey: 'ROBOT',
          });
        }

  return Promise.resolve(null);
}

export {};

export {};
