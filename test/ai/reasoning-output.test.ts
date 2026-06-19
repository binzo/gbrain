import { describe, expect, test } from 'bun:test';
import { stripReasoningPrelude } from '../../src/core/ai/reasoning-output.ts';

describe('stripReasoningPrelude', () => {
  test('removes a closed reasoning prelude before final JSON', () => {
    expect(stripReasoningPrelude('<think>{"scratch": true}</think>\n{"ok":true}')).toBe('{"ok":true}');
  });

  test('returns null for an unclosed reasoning prelude', () => {
    expect(stripReasoningPrelude('<think>still reasoning {"ok":true}')).toBeNull();
  });

  test('does not strip literal <think> after the JSON answer has started', () => {
    const raw = '{"text":"keep <think> literally"}';
    expect(stripReasoningPrelude(raw)).toBe(raw);
  });
});
