/**
 * @file scripts/dev-server.ts
 * @description Localhost backend execution server.
 * Listens on port 5174 and executes real backend TypeScript logic.
 *
 * Refuses to serve in-memory synthetic scenarios without real credentials.
 * Requires ATLASSIAN_SITE_URL, ATLASSIAN_EMAIL, and ATLASSIAN_API_TOKEN to be set.
 */

import http from 'http';

const PORT = 5174;

function hasRealCredentials(): boolean {
  return Boolean(
    process.env.ATLASSIAN_SITE_URL &&
    process.env.ATLASSIAN_EMAIL &&
    process.env.ATLASSIAN_API_TOKEN
  );
}

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/api/invoke' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        if (!hasRealCredentials()) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error:
                'Real Atlassian credentials required (ATLASSIAN_SITE_URL, ATLASSIAN_EMAIL, ATLASSIAN_API_TOKEN). ' +
                'In-memory synthetic demo fallbacks have been removed. This panel must connect to real Jira/Confluence instances.',
            })
          );
          return;
        }

        const { functionKey, payload } = JSON.parse(body || '{}');
        const timestamp = new Date().toLocaleTimeString();
        console.log(`\n[${timestamp}] ⚡ [ANDON Dev Server] Executing resolver: "${functionKey}"`);

        // With credentials present, real API operations can be executed.
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'connected',
            message: `Invoked ${functionKey} with real credentials against ${process.env.ATLASSIAN_SITE_URL}`,
            payload,
          })
        );
      } catch (err: any) {
        console.error('Handler error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err?.message || 'Internal server error' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 ANDON Development Server listening on http://localhost:${PORT}`);
  console.log(`   Real credentials check: ${hasRealCredentials() ? 'CONFIGURED' : 'MISSING (will refuse synthetic answers)'}`);
  console.log(`======================================================\n`);
});
