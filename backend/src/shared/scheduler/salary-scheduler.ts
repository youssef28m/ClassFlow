import cron from 'node-cron';
import { logger } from '../../config/logger.js';
import { SalaryRepository } from '../../modules/finance/repositories/salary.repository.js';
import { SalaryService } from '../../modules/finance/services/salary.service.js';
import { prisma } from '../prisma/prisma-client.js';

export function startSalaryScheduler(): void {
  cron.schedule('0 0 1 * *', async () => {
    logger.info('Running monthly salary calculation cron job');

    try {
      const centers = await prisma.center.findMany({
        where: { active: true },
        select: { id: true, name: true },
      });

      const repository = new SalaryRepository();
      const service = new SalaryService(repository);

      for (const center of centers) {
        try {
          const result = await service.payAllForPreviousMonth(center.id);
          logger.info({ centerId: center.id, centerName: center.name, ...result }, 'Salary cron completed for center');
        } catch (error) {
          logger.error({ centerId: center.id, error }, 'Salary cron failed for center');
        }
      }
    } catch (error) {
      logger.error({ error }, 'Salary cron job failed');
    }
  });

  logger.info('Salary scheduler started (runs on the 1st of each month at midnight)');
}
