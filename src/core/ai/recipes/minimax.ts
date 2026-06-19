import type { Recipe } from '../types.ts';

/**
 * MiniMax (海螺AI) Token Plan. The platform exposes MiniMax-M3 through an
 * OpenAI-compatible /chat/completions endpoint at api.minimaxi.com.
 *
 * Reference: https://platform.minimaxi.com/docs/token-plan/other-tools
 */
export const minimax: Recipe = {
  id: 'minimax',
  name: 'MiniMax (海螺AI)',
  tier: 'openai-compat',
  implementation: 'openai-compatible',
  base_url_default: 'https://api.minimaxi.com/v1',
  auth_env: {
    required: ['MINIMAX_API_KEY'],
    setup_url: 'https://platform.minimaxi.com/user-center/payment/token-plan',
  },
  touchpoints: {
    chat: {
      models: ['MiniMax-M3'],
      supports_tools: true,
      supports_subagent_loop: true,
      supports_prompt_cache: false,
      max_context_tokens: 512_000,
      cost_per_1m_input_usd: 0.3,
      cost_per_1m_output_usd: 1.2,
      price_last_verified: '2026-06-19',
    },
  },
  setup_hint:
    'Get a Token Plan API key at https://platform.minimaxi.com/user-center/payment/token-plan, then `export MINIMAX_API_KEY=...` and use `minimax:MiniMax-M3`.',
};
