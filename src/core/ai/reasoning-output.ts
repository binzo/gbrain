/**
 * Reasoning models may prepend a hidden-thought transcript before the final
 * answer, commonly as `<think>...</think>`. Parser call sites that expect JSON
 * should ignore that prelude, but the gateway must not strip it globally: plain
 * chat/think callers may want to render the model's text exactly as returned.
 */
export function stripReasoningPrelude(raw: string): string | null {
  const text = raw.trim();
  if (!text) return text;

  const open = text.search(/<think>/i);
  if (open < 0) return text;

  const firstJson = firstJsonishIndex(text);
  if (firstJson >= 0 && firstJson < open) return text;

  const closeMatch = /<\/think>/i.exec(text.slice(open));
  if (!closeMatch || closeMatch.index < 0) return null;
  return text.slice(open + closeMatch.index + closeMatch[0].length).trim();
}

function firstJsonishIndex(text: string): number {
  const indexes = ['{', '[', '```'].map(token => text.indexOf(token)).filter(i => i >= 0);
  return indexes.length === 0 ? -1 : Math.min(...indexes);
}
