import type { Request } from 'express';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Request garantizado por authMiddleware: `user` siempre está presente.
// Usar con asyncHandler<AuthedRequest> en handlers detrás de authMiddleware
// para acceder a req.user.id sin non-null assertions.
export interface AuthedRequest extends Request {
  user: SupabaseUser;
}
