import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './shared/prisma/prisma-client.js';
import { startSalaryScheduler } from './shared/scheduler/salary-scheduler.js';

async function bootstrap(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connection established');

    if (env.NODE_ENV !== 'test') {
      startSalaryScheduler();
    }

    const app = createApp();
    const server = app.listen(env.PORT, env.HOST, () => {
      logger.info(`API server listening on http://${env.HOST}:${env.PORT} (${env.NODE_ENV})`);
    });

    const shutdown = (signal: NodeJS.Signals): void => {
      logger.info({ signal }, 'Graceful shutdown initiated');

      const forceExit = setTimeout(() => {
        logger.error('Forced shutdown after 10s timeout');
        process.exit(1);
      }, 10_000);
      forceExit.unref();

      server.close(async () => {
        try {
          await prisma.$disconnect();
          clearTimeout(forceExit);
          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (err) {
          logger.error({ err }, 'Error during graceful shutdown');
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    process.on('unhandledRejection', (reason) => {
      logger.error({ err: reason }, 'Unhandled promise rejection');
      process.exit(1);
    });

    process.on('uncaughtException', (err) => {
      logger.error({ err }, 'Uncaught exception');
      process.exit(1);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to bootstrap application');
    process.exit(1);
  }
}

void bootstrap();
