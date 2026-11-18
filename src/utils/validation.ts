export function sanitizeDocId(raw: string): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return cleaned || `item-${Date.now()}`;
}

export function createUniqueId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return sanitizeDocId(`${prefix}-${Date.now()}-${random}`);
}

export function preserveDocId(raw: string): string {
  const trimmed = raw.trim();
  if (/^[a-zA-Z0-9_-]{1,128}$/.test(trimmed)) {
    return trimmed;
  }
  return sanitizeDocId(trimmed);
}

export function clampString(value: unknown, maxLength: number, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim().slice(0, maxLength);
  return trimmed.length > 0 ? trimmed : fallback;
}

export function clampOptionalString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

export function clampStringList(value: string[], maxItems: number, maxItemLen: number): string[] {
  return value
    .map((item) => item.trim().slice(0, maxItemLen))
    .filter((item) => item.length > 0)
    .slice(0, maxItems);
}

export function isValidExternalUrl(url: string): boolean {
  if (!url) return true;
  if (url.startsWith('/')) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
