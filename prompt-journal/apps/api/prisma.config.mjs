// apps/api/prisma.config.mjs
import 'dotenv/config'; // 显式加载环境变量

export default {
  // Prisma 7 新标准：在这里配置数据源
  datasource: {
    url: process.env.DATABASE_URL
  }
};