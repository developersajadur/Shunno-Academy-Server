import config from '../config';
import { logger, errorLogger } from '../shared/logger';

let keepAliveTimer: NodeJS.Timeout | null = null;

/**
 * Initializes auto-ping keep-alive cron on Render.
 * Fires every 14 minutes to prevent Render Free tier from spinning down due to inactivity.
 */
export function initKeepAlive() {
  const isRender =
    config.host_on?.toLowerCase() === 'render' ||
    process.env.RENDER === 'true' ||
    Boolean(process.env.RENDER_EXTERNAL_URL);

  if (!isRender) {
    logger.info('⏸️ Render Keep-Alive job skipped (HOST_ON is not set to "render")');
    return;
  }

  const serverBaseUrl =
    config.server_url ||
    process.env.RENDER_EXTERNAL_URL ||
    `http://localhost:${config.port}`;

  const healthUrl = `${serverBaseUrl.replace(/\/$/, '')}/api/v1/health`;
  const intervalMs = 14 * 60 * 1000; // 14 minutes

  logger.info(`🛡️ Render Keep-Alive Cron initialized. Target: ${healthUrl} (Interval: every 14 minutes)`);

  const pingServer = async () => {
    try {
      const response = await fetch(healthUrl, {
        headers: {
          'User-Agent': 'Shunno-Academy-Render-KeepAlive/1.0',
        },
      });

      if (response.ok) {
        logger.info(`🏓 [Keep-Alive] Self-ping successful (${healthUrl}) - Status: ${response.status} OK`);
      } else {
        errorLogger.warn(`⚠️ [Keep-Alive] Self-ping responded with status ${response.status}`);
      }
    } catch (err: any) {
      errorLogger.warn(`⚠️ [Keep-Alive] Self-ping attempt failed: ${err.message}`);
    }
  };

  // Schedule recurring interval every 14 minutes
  keepAliveTimer = setInterval(pingServer, intervalMs);

  // Unref timer so it does not block Node process shutdown
  if (keepAliveTimer.unref) {
    keepAliveTimer.unref();
  }
}

/**
 * Stops keep-alive timer on server shutdown
 */
export function stopKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

