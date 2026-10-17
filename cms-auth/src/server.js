// @ts-check
import { createServer } from 'node:http';
import { createApp, createUnconfiguredApp, loadConfig } from './app.js';

const log = (msg) => console.log(`[cms-auth] ${msg}`);
const port = Number(process.env.PORT ?? 8081);

let handler;
try {
  const config = loadConfig();
  handler = createApp({ config, log });
  log(`ready for ${config.publicOrigin}`);
} catch (err) {
  // Missing OAuth settings must not take the site down: stay up, report it, refuse logins.
  log(`not configured: ${err instanceof Error ? err.message : err}`);
  handler = createUnconfiguredApp(String(err instanceof Error ? err.message : err));
}

const server = createServer(handler);
server.headersTimeout = 15_000;
server.requestTimeout = 30_000;
server.listen(port, () => log(`listening on :${port}`));

const shutdown = (signal) => {
  log(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
