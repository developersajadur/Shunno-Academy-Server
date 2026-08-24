import config from '../config';
import { logger, errorLogger } from '../shared/logger';

let keepAliveTimer: NodeJS.Timeout | null = null;
let initialTimer: NodeJS.Timeout | null = null;

/**
 * Initializes auto-ping keep-alive cron on Render.
 * Fires every 10 minutes to keep Render Web Services active and prevent cold starts.
 */
export function initKeepAlive() {
  const hostOn = (config.host_on || process.env.HOST_ON || '').toLowerCase().trim();
  const isRender =
    hostOn === 'render' ||
    hostOn === 'true' ||
    process.env.RENDER === 'true' ||
    Boolean(process.env.RENDER_EXTERNAL_URL);

  if (!isRender) {
    logger.info('⏸️ Render Keep-Alive job skipped (HOST_ON is not set to "render")');
    return;
  }

  const rawServerUrl =
    config.server_url ||
    process.env.SERVER_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    `http://localhost:${config.port}`;

  const serverBaseUrl = rawServerUrl.replace(/\/$/, '');
  const healthUrl = `${serverBaseUrl}/api/v1/health`;
  const intervalMs = 10 * 60 * 1000; // 10 minutes

  logger.info(`🛡️ [Render Keep-Alive] Cron active. Target: ${healthUrl} (Interval: every 10 minutes)`);

  const pingServer = async () => {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Shunno-Academy-KeepAlive-Cron/1.0',
          'Cache-Control': 'no-cache',
        },
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      if (response.ok) {
        logger.info(`🏓 [Render Keep-Alive] Self-ping successful (${healthUrl}) - Status: ${response.status} OK | Latency: ${latency}ms`);
      } else {
        errorLogger.warn(`⚠️ [Render Keep-Alive] Self-ping status ${response.status} for ${healthUrl} | Latency: ${latency}ms`);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      errorLogger.warn(`⚠️ [Render Keep-Alive] Ping attempt to ${healthUrl} failed (${latency}ms): ${err.message}`);
    }
  };

  // 1. Trigger initial ping 10 seconds after server launch
  initialTimer = setTimeout(pingServer, 10000);
  if (initialTimer.unref) {
    initialTimer.unref();
  }

  // 2. Schedule recurring ping every 10 minutes
  keepAliveTimer = setInterval(pingServer, intervalMs);
  if (keepAliveTimer.unref) {
    keepAliveTimer.unref();
  }
}

/**
 * Stops keep-alive timers on server shutdown
 */
export function stopKeepAlive() {
  if (initialTimer) {
    clearTimeout(initialTimer);
    initialTimer = null;
  }
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}
