import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load .env dari root project jika ada
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  MOCK_CHAIN: z.coerce.boolean().default(true),
  ADMIN_API_KEY: z.string().default('pawn_pool_admin_key_123'),
  JWT_SECRET: z.string().default('pawn_pool_jwt_secret_999'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
