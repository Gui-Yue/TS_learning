// apps/api/src/lib/db.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// 1. 创建 Postgres 连接池
const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 2. 挂载到全局变量 (防止开发环境热重启导致连接泄露)
// 这是一个标准的 TypeScript 单例模式写法
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// 3. 如果已有实例就复用，没有就新建
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;