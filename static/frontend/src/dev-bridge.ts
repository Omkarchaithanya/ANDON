/// <reference types="vite/client" />
/**
 * @file dev-bridge.ts
 * @description Localhost development harness.
 *
 * In Atlassian Cloud / Jira Custom UI iframe, Forge automatically injects window.__bridge.
 * When running in local development mode without Forge context, this harness safely
 * communicates that the Forge platform context is required, rather than synthesizing
 * fake issues or ungrounded data.
 */

if ((import.meta as any).env?.DEV && typeof window !== 'undefined' && !(window as any).__bridge) {
  const BRIDGE_UNAVAILABLE_MSG = 'Forge bridge unavailable. This panel only works inside a Jira issue on an installed app.';

  (window as any).__bridge = {
    callBridge: function (action: string, payload: any) {
      if (action === 'getContext') {
        return Promise.reject(new Error(BRIDGE_UNAVAILABLE_MSG));
      }

      if (action === 'invoke') {
        const fn = payload && payload.functionKey;

        // If local dev server is running on :5174, forward the call; otherwise reject honestly.
        return fetch('http://localhost:5174/api/invoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ functionKey: fn, payload: payload?.payload }),
        })
          .then(async (res) => {
            if (res.ok) {
              return await res.json();
            }
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Server returned HTTP ${res.status}`);
          })
          .catch((err) => {
            console.warn(`[ANDON Dev Bridge] Backend error for "${fn}":`, err?.message);
            return Promise.reject(
              new Error(`${BRIDGE_UNAVAILABLE_MSG} (${err?.message || 'backend offline'})`)
            );
          });
      }
      return Promise.reject(new Error(BRIDGE_UNAVAILABLE_MSG));
    },
  };
}

export {};
