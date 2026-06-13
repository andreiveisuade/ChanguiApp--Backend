import type { CorsOptions } from 'cors';

const allowedOrigins: string[] = process.env.ALLOWED_ORIGINS?.split(',') ?? [
  'http://localhost:8081',
];

export const corsOptions: CorsOptions = {
  origin: allowedOrigins,
  credentials: true,
};
