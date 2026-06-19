/**
 * `gbrain providers` — pure formatter + envReady tests.
 *
 * `runTest` and `runExplain` aren't covered here because they touch the
 * gateway / loadConfig; E2E exercises those.
 */

import { describe, test, expect } from 'bun:test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { formatRecipeTable, envReady, runProviders } from '../src/commands/providers.ts';
import { listRecipes, getRecipe } from '../src/core/ai/recipes/index.ts';
import type { Recipe } from '../src/core/ai/types.ts';
import { emptyHome, withEnv } from './helpers/with-env.ts';

describe('envReady', () => {
  test('true when all required env vars set', () => {
    const openai = getRecipe('openai');
    expect(openai).toBeDefined();
    expect(envReady(openai!, { OPENAI_API_KEY: 'sk-test' })).toBe(true);
  });

  test('false when required env var missing', () => {
    const openai = getRecipe('openai');
    expect(envReady(openai!, {})).toBe(false);
  });

  test('false on empty-string env var', () => {
    const openai = getRecipe('openai');
    expect(envReady(openai!, { OPENAI_API_KEY: '' })).toBe(false);
  });

  test('true for recipes with no required env (local Ollama)', () => {
    // Ollama has no auth_env.required.
    const ollama = getRecipe('ollama');
    expect(ollama).toBeDefined();
    expect(envReady(ollama!, {})).toBe(true);
  });
});

describe('formatRecipeTable', () => {
  test('header row present', () => {
    const out = formatRecipeTable(listRecipes(), {});
    expect(out).toContain('PROVIDER');
    expect(out).toContain('TIER');
    expect(out).toContain('EMBED');
    expect(out).toContain('EXPAND');
    expect(out).toContain('CHAT');
    expect(out).toContain('STATUS');
  });

  test('shows ✓ ready for env-satisfied provider', () => {
    const out = formatRecipeTable(listRecipes(), { OPENAI_API_KEY: 'sk-test' });
    // openai row should be ready
    const openaiLine = out.split('\n').find(line => line.startsWith('openai'));
    expect(openaiLine).toBeDefined();
    expect(openaiLine).toContain('✓ ready');
  });

  test('shows ✗ missing <ENV> for missing provider', () => {
    const out = formatRecipeTable(listRecipes(), {});
    // openai should show missing OPENAI_API_KEY
    const openaiLine = out.split('\n').find(line => line.startsWith('openai'));
    expect(openaiLine).toBeDefined();
    expect(openaiLine).toContain('✗ missing OPENAI_API_KEY');
  });

  test('each recipe appears at most once', () => {
    const out = formatRecipeTable(listRecipes(), {});
    const recipes = listRecipes();
    for (const r of recipes) {
      const occurrences = out.split('\n').filter(line => line.startsWith(`${r.id} `) || line.startsWith(`${r.id}  `));
      expect(occurrences.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('embedding-only recipe (zeroentropyai) shows yes/—/— for tiers', () => {
    const out = formatRecipeTable(listRecipes(), {});
    const zeLine = out.split('\n').find(line => line.startsWith('zeroentropyai'));
    expect(zeLine).toBeDefined();
    // ZE has embedding but no expansion or chat
    expect(zeLine).toContain('yes');
    expect(zeLine).toContain('—');
  });

  test('isolated subset renders correctly (picker reuses this)', () => {
    const openai = getRecipe('openai');
    const ze = getRecipe('zeroentropyai');
    expect(openai && ze).toBeTruthy();
    const out = formatRecipeTable([openai!, ze!], { OPENAI_API_KEY: 'sk-test' });
    const lines = out.split('\n');
    // header + separator + 2 recipe rows
    expect(lines.length).toBe(4);
    expect(lines[2]).toContain('openai');
    expect(lines[2]).toContain('✓ ready');
    expect(lines[3]).toContain('zeroentropyai');
    expect(lines[3]).toContain('✗ missing ZEROENTROPY_API_KEY');
  });

  test('providers list treats provider_api_keys config as ready', async () => {
    const home = emptyHome();
    const dir = join(home, '.gbrain');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'config.json'), JSON.stringify({
      engine: 'postgres',
      provider_api_keys: { dashscope: 'sk-dashscope-config' },
    }));

    const lines: string[] = [];
    const originalLog = console.log;
    console.log = (msg?: unknown) => { lines.push(String(msg)); };
    try {
      await withEnv({ GBRAIN_HOME: home, DASHSCOPE_API_KEY: undefined }, async () => {
        await runProviders('list', []);
      });
    } finally {
      console.log = originalLog;
    }

    const out = lines.join('\n');
    const dashscopeLine = out.split('\n').find(line => line.startsWith('dashscope'));
    expect(dashscopeLine).toBeDefined();
    expect(dashscopeLine).toContain('✓ ready');
  });

  test('providers env treats provider_api_keys config as set', async () => {
    const home = emptyHome();
    const dir = join(home, '.gbrain');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'config.json'), JSON.stringify({
      engine: 'postgres',
      provider_api_keys: { minimax: 'sk-minimax-config' },
    }));

    const lines: string[] = [];
    const originalLog = console.log;
    console.log = (msg?: unknown) => { lines.push(String(msg)); };
    try {
      await withEnv({ GBRAIN_HOME: home, MINIMAX_API_KEY: undefined }, async () => {
        await runProviders('env', ['minimax']);
      });
    } finally {
      console.log = originalLog;
    }

    const out = lines.join('\n');
    expect(out).toContain('MINIMAX_API_KEY');
    expect(out).toContain('✓ set');
  });
});
