import { rateLimit } from 'express-rate-limit';
import { env } from '../../config/env.js';

const RATE_LIMIT_MESSAGE = {
  status: 'error',
  message: 'Too many requests, please try again later',
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const SIGNUP_WINDOW_MS = 60 * 60 * 1000;

export const loginLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: env.LOGIN_RATE_LIMIT,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: RATE_LIMIT_MESSAGE,
});

export const refreshLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: env.REFRESH_RATE_LIMIT,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: RATE_LIMIT_MESSAGE,
});

export const signupLimiter = rateLimit({
  windowMs: SIGNUP_WINDOW_MS,
  limit: env.SIGNUP_RATE_LIMIT,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: RATE_LIMIT_MESSAGE,
});
