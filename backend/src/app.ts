import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env, parseCorsOrigins } from './config/env.js';
import { logger } from './config/logger.js';
import authRouter from './modules/auth/routes/auth.routes.js';
import centerRouter from './modules/centers/routes/center.routes.js';
import enrollmentRouter from './modules/enrollments/routes/enrollment.routes.js';
import expenseRouter from './modules/finance/routes/expense.routes.js';
import paymentRouter from './modules/finance/routes/payment.routes.js';
import salaryRouter from './modules/finance/routes/salary.routes.js';
import groupRouter from './modules/groups/routes/group.routes.js';
import scheduleRouter from './modules/schedules/routes/schedule.routes.js';
import sessionRouter from './modules/sessions/routes/session.routes.js';
import studentRouter from './modules/students/routes/student.routes.js';
import teacherRouter from './modules/teachers/routes/teacher.routes.js';
import userRouter from './modules/users/routes/user.routes.js';
import { errorHandler } from './shared/middleware/error-handler.js';
import { notFoundHandler } from './shared/middleware/not-found.js';
import healthRouter from './shared/routes/health.routes.js';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.NODE_ENV === 'production');

  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    }),
  );

  const corsOrigins = parseCorsOrigins(env.CORS_ORIGIN);
  app.use(
    cors({
      origin: corsOrigins.includes('*') ? true : corsOrigins,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/centers', centerRouter);
  app.use('/api/students', studentRouter);
  app.use('/api/teachers', teacherRouter);
  app.use('/api/groups', groupRouter);
  app.use('/api/enrollments', enrollmentRouter);
  app.use('/api/users', userRouter);
  app.use('/api/schedules', scheduleRouter);
  app.use('/api/sessions', sessionRouter);
  app.use('/api/payments', paymentRouter);
  app.use('/api/expenses', expenseRouter);
  app.use('/api/teacher-salaries', salaryRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
