/** Destinos de conteúdo editorial: nunca aceitar protocolos executáveis ou credenciais. */
export function editorialUrl(value: unknown, allowLocal = false): string | undefined {
  if (typeof value !== "string" || value.length > 2048 || /[\\"<>]/.test(value) || [...value].some(char => char.charCodeAt(0) <= 32)) return;
  if (allowLocal && /^\/(?!\/)/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return;
    return url.href;
  } catch { return; }
}

export function editorialSrcSet(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 8192) return;
  const entries = value.split(",").map((entry) => {
    const [url, size, ...extra] = entry.trim().split(/\s+/);
    return editorialUrl(url, true) && /^\d+w$/.test(size ?? "") && !extra.length ? `${url} ${size}` : null;
  });
  return entries.length && entries.every(Boolean) ? entries.join(", ") : undefined;
}

export function imageUploadError(file: Pick<File, "size" | "type">): string | null {
  if (!["image/webp", "image/jpeg", "image/png"].includes(file.type)) return "Escolha uma imagem WebP, JPG ou PNG.";
  if (file.size <= 0 || file.size > 5 * 1024 * 1024) return "A imagem deve ter conteúdo e no máximo 5 MB.";
  return null;
}
