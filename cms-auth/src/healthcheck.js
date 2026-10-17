// Container healthcheck: exits 0 when the service answers on /cms-auth/health.
const port = process.env.PORT ?? 8081;
fetch(`http://127.0.0.1:${port}/cms-auth/health`, { signal: AbortSignal.timeout(2500) })
  .then((r) => process.exit(r.ok ? 0 : 1))
  .catch(() => process.exit(1));
