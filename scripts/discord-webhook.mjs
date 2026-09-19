const DISCORD_WEBHOOK_HOSTS = new Set(['discord.com', 'discordapp.com']);

export function validateDiscordWebhook(value) {
  let url;
  try {
    url = new URL(String(value ?? ''));
  } catch {
    throw new Error('DISCORD_WEBHOOK_URL inválido.');
  }
  if (url.protocol !== 'https:' || !DISCORD_WEBHOOK_HOSTS.has(url.hostname)
    || !/^\/api\/webhooks\/\d+\/[A-Za-z0-9._-]+\/?$/.test(url.pathname)
    || url.username || url.password || url.search || url.hash) {
    throw new Error('DISCORD_WEBHOOK_URL inválido.');
  }
  return url;
}

function clamp(value, limit) {
  const text = String(value ?? '').trim();
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

export async function sendDiscordWebhook({ webhookUrl, title, description, url, color = 0xF5A800 }, fetchImpl = fetch) {
  const endpoint = validateDiscordWebhook(webhookUrl);
  const embed = {
    title: clamp(title, 256),
    description: clamp(description, 4_000),
    color,
    timestamp: new Date().toISOString(),
  };
  if (url) embed.url = String(url);
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      username: 'Central MBdaR',
      allowed_mentions: { parse: [] },
      embeds: [embed],
    }),
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Discord recusou a notificação (HTTP ${response.status}).`);
  }
}

