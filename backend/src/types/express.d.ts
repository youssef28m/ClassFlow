import type { AuthUser } from '../modules/auth/types/auth.types.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      centerId?: number | null;
    }
  }
}
