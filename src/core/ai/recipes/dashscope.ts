import type { Recipe } from '../types.ts';

/**
 * Alibaba DashScope / Model Studio (百炼). GBrain supports the current
 * text-embedding-v4 model (Matryoshka-aware up to 2048 dims). Hosted
 * reranking lives in the sibling `dashscope-rerank` recipe because Alibaba
 * exposes it under a different API base prefix.
 *
 * References:
 *   https://help.aliyun.com/zh/model-studio/embedding
 *
 * Note: the international endpoint requires a region-aware DASHSCOPE_API_KEY.
 * China-region users point cfg.base_urls['dashscope'] at their Beijing
 * workspace's `/compatible-mode/v1` embedding base. v0.32 ships with the
 * international default; users override per the recipe convention.
 */
export const dashscope: Recipe = {
  id: 'dashscope',
  name: 'Alibaba DashScope (灵积)',
  tier: 'openai-compat',
  implementation: 'openai-compatible',
  base_url_default: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
  auth_env: {
    required: ['DASHSCOPE_API_KEY'],
    setup_url: 'https://help.aliyun.com/zh/model-studio/getting-started/',
  },
  touchpoints: {
    embedding: {
      models: ['text-embedding-v4'],
      default_dims: 1024,
      dims_options: [64, 128, 256, 512, 768, 1024, 1536, 2048],
      // Alibaba documents region-specific aggregate caps for v4: Beijing
      // allows 33,000 tokens per batch, while the Singapore table lists
      // 8,192. Each v4 input text is capped at 8,192 tokens. Keep the
      // cross-region conservative cap here; China-region users overriding
      // base_url trade throughput, not correctness.
      max_batch_tokens: 8192,
      // DashScope's OpenAI-compat /embeddings endpoint rejects requests with
      // more than 10 input items (documented Model Studio cap). The gateway's
      // capBatchItems pre-split enforces this; max_batch_tokens above keeps
      // guarding aggregate token size. Concept from community PRs #2643/#2405.
      max_batch_items: 10,
      // text-embedding-v4 mixes English + CJK heavily; the tokenizer is
      // closer to Voyage density than OpenAI tiktoken for CJK-dominant
      // content. Conservative chars_per_token=2 leaves headroom.
      chars_per_token: 2,
    },
  },
  setup_hint:
    'Set `DASHSCOPE_API_KEY` or `dashscope_api_key` in ~/.gbrain/config.json; China-region users configure ' +
    '`provider_base_urls.dashscope` to "https://<WorkspaceId>.cn-beijing.maas.aliyuncs.com/compatible-mode/v1". ' +
    'Use the separate `dashscope-rerank` recipe for qwen3-rerank.',
};
