/**
 * MiniMax recipe smoke.
 *
 * Coverage:
 *  - Recipe registered with expected shape
 *  - default auth: MINIMAX_API_KEY → "Bearer <key>"; missing → AIConfigError
 *  - Token Plan chat is exposed through the OpenAI-compatible MiniMax-M3 model
 */

import { describe, expect, test } from 'bun:test';
import { getRecipe } from '../../src/core/ai/recipes/index.ts';
import { defaultResolveAuth } from '../../src/core/ai/gateway.ts';
import { assertTouchpoint } from '../../src/core/ai/model-resolver.ts';
import { AIConfigError } from '../../src/core/ai/errors.ts';

describe('recipe: minimax', () => {
  test('registered with expected shape', () => {
    const r = getRecipe('minimax');
    expect(r).toBeDefined();
    expect(r!.id).toBe('minimax');
    expect(r!.tier).toBe('openai-compat');
    expect(r!.implementation).toBe('openai-compatible');
    expect(r!.base_url_default).toBe('https://api.minimaxi.com/v1');
    expect(r!.auth_env?.required).toEqual(['MINIMAX_API_KEY']);
    expect(r!.auth_env?.optional).toBeUndefined();
  });

  test('chat touchpoint declares MiniMax-M3 and no embedding touchpoint', () => {
    const r = getRecipe('minimax')!;
    expect(r.touchpoints.embedding).toBeUndefined();
    expect(r.touchpoints.chat).toBeDefined();
    expect(r.touchpoints.chat!.models).toEqual(['MiniMax-M3']);
    expect(r.touchpoints.chat!.supports_tools).toBe(true);
    expect(r.touchpoints.chat!.supports_subagent_loop).toBe(true);
    expect(r.touchpoints.chat!.supports_prompt_cache).toBe(false);
    expect(r.touchpoints.chat!.max_context_tokens).toBe(512_000);
    expect(r.touchpoints.chat!.cost_per_1m_input_usd).toBe(0.3);
    expect(r.touchpoints.chat!.cost_per_1m_output_usd).toBe(1.2);
    expect(() => assertTouchpoint(r, 'chat', 'MiniMax-M3')).not.toThrow();
  });

  test('default auth: MINIMAX_API_KEY set → "Bearer <key>"', () => {
    const r = getRecipe('minimax')!;
    const auth = defaultResolveAuth(r, { MINIMAX_API_KEY: 'fake-mm-key' }, 'chat');
    expect(auth.headerName).toBe('Authorization');
    expect(auth.token).toBe('Bearer fake-mm-key');
  });

  test('default auth: missing MINIMAX_API_KEY → AIConfigError', () => {
    const r = getRecipe('minimax')!;
    expect(() => defaultResolveAuth(r, {}, 'chat')).toThrow(AIConfigError);
  });
});
