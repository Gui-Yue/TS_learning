// apps/api/src/test-db.ts
import 'dotenv/config'; 
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg'; // 引入适配器
import { Pool } from 'pg'; // 引入原生驱动

// 1. 准备连接池
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('X 环境变量未加载');

const pool = new Pool({ connectionString });

// 2. 创建适配器
const adapter = new PrismaPg(pool);

// 3. 初始化 Prisma (传入 adapter)
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(' 开始连接数据库 (Adapter模式)...');

  // 写入测试
  const newUser = await prisma.user.create({
    data: {
      email: `adapter_test_${Date.now()}@example.com`,
      password: 'password_modern_way',
      role: 'USER',
      prompts: {
        create: {
          title: 'Prisma 7 Adapter Mode',
          content: '这就是未来 Serverless 数据库的标准连接方式！',
          tags: ['Adapter', 'PG']
        }
      }
    },
  });

  console.log('√ 成功写入数据:', newUser);
  
  const count = await prisma.user.count();
  console.log(` 数据库当前用户数: ${count}`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // 记得关闭连接池
  });