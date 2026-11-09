/**
 * @file test/smoke/llm-smoke.ts
 * @description Live Smoke Test against a real Atlassian Forge Cloud instance.
 *
 * NOTE ON TEST BOUNDARIES:
 * Mocked unit tests verify schema validation, injection defenses, and error branches.
 * THEY DO NOT PROVE THAT THE REAL FORGE LLM API IS CALLABLE OR OPERATIONAL.
 * Only running this smoke test on a live Atlassian Forge environment proves live model execution.
 */

import { chat, list } from '@forge/llm';

export async function runLlmSmokeTest(): Promise<{ success: boolean; model: string; output: string }> {
  console.log('[LLM Smoke] Querying available models from Forge...');
  const models = await list();
  console.log('[LLM Smoke] Models found:', JSON.stringify(models));

  const activeModel = models.models.find((m) => m.status === 'active' && m.model.includes('claude'));
  const modelToUse = activeModel?.model || 'claude-sonnet-4-6';

  console.log(`[LLM Smoke] Calling live model ${modelToUse}...`);
  const response = await chat({
    model: modelToUse,
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: [{ type: 'text', text: 'You are ANDON. Respond with JSON: {"status": "ok"}' }],
      },
      {
        role: 'user',
        content: [{ type: 'text', text: 'Healthcheck ping.' }],
      },
    ],
  });

  const content = response.choices?.[0]?.message?.content;
  const rawText = typeof content === 'string' ? content : JSON.stringify(content);
  console.log('[LLM Smoke] Received live response:', rawText);

  return {
    success: true,
    model: modelToUse,
    output: rawText,
  };
}
