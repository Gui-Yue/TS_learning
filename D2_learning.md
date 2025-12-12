###  Day 2 学习任务概览

今天的核心目标是**后端项目初始化与数据库连接**，具体包含以下四个里程碑：

1.  **目录重构 (Monorepo)**：按照工业级标准，将项目拆分为 `apps/api`（后端）和 `apps/web`（前端）。
2.  **Web 框架 (Fastify)**：搭建 HTTP 服务。
    *   *对标*：类似 Go 的 **Gin** 或 Python 的 **FastAPI** (高性能、轻量级)。
3.  **ORM 与数据库 (Prisma + PostgreSQL)**：设计数据模型并连接数据库。
    *   *对标*：Prisma 是目前 Node 界的 GORM/SQLAlchemy，但它是 **Schema First** 的（先写 schema 文件，自动生成类型安全的 Client）。


### 创建标准化项目，并搭建脚手架
```bash
# 在prompt-journal目录下创建标准前后端分离的目录
$ pnpm init 
$ pnpm add -D typescript tsx @types/node
$ npx tsc --init
# 然后和昨天一样修改生成的tsconfig.json
# 到此根目录的环境搭建完毕

# 现在开始初始化后端项目
$ mkdir -p apps/api
$ cd apps/api && pnpm init
# 将apps/api/package.json中的name 改得规范一点（方便以后互相引用）
# "name": "@prompt-journal/api",

# 安装开发工具链以及后端核心依赖
$ pnpm add fastify dotenv @prisma/client @prisma/adapter-pg @types/pg
# 创建后端api配置
$ touch tsconfig.json
$ mkdir src && touch src/index.ts
# 至此后端的配置工作完成
```
tsconfig.json内容如下：
```json
{
  "extends": "../../tsconfig.json", 
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```
### 写一个简单的后端，功能为简单的http服务
在apps/api/src/index.ts中写入：
```ts
import Fastify from 'fastify';

// 1. 初始化实例
// Go: gin.Default()
// Python: app = FastAPI()
const server = Fastify({
  logger: true // 开启内置日志，不用自己 print 了
});

// 2. 定义路由
// Go: r.GET("/ping", func(c *gin.Context) { ... })
// Python: @app.get("/ping")
server.get('/ping', async (request, reply) => {
  // 直接返回对象，Fastify 会自动序列化成 JSON
  return { 
    message: 'pong', 
    timestamp: new Date() 
  };
});

// 3. 启动服务
const start = async () => {
  try {
    // 监听 3001 端口
    // host: '0.0.0.0' 是为了让外部（如 Docker 或局域网）也能访问
    await server.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server is running at http://localhost:3001');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
```
为了方便启动，我们可以在 apps/api/package.json 里加个快捷命令。
```json
{
  "name": "@prompt-journal/api",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev": "tsx watch src/index.ts" 
    // tsx: 我们之前在根目录装的运行器。watch: 这是一个非常实用的参数。它会监听文件变化，一旦你保存代码，服务器自动重启。
  },
  // ... 其他依赖字段
}
```
现在我们就能启动服务了
```bash
$ pnpm dev
# 启动完成后即可通过浏览器访问到其路由的http://localhost:3001/ping
```
至此，后端基础http功能跑通了

### PostgreSQL相关内容的补充学习
#### 安装postgresql
```bash
# 安装必要工具
$ sudo apt update && sudo apt install -y postgresql-common curl
$ sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh
$ sudo apt update
$ sudo apt install postgresql-16 -y
$ psql --version
psql (PostgreSQL) 16.11 (Ubuntu 16.11-1.pgdg22.04+1)
```
#### 进入数据库终端并实现quick start
```bash
$ sudo -u postgres psql
psql (16.11 (Ubuntu 16.11-1.pgdg22.04+1))
Type "help" for help.

postgres=# CREATE USER prompt_user WITH PASSWORD 'password123'; # 创建用户 'prompt_user'，密码 'password123'
CREATE ROLE
postgres=# CREATE DATABASE prompt_journal_db OWNER prompt_user; # 创建数据库 'prompt_journal_db'
CREATE DATABASE
postgres=# ALTER USER prompt_user CREATEDB; # 授予建表权限
ALTER ROLE
postgres=# \q # 退出
```

### 完成postgresql的配置后即可利用Prisma链接数据库
配置连接字符串（.env）
```bash
$ pwd
prompt-journal/apps/api
$ npx prisma init --datasource-provider postgresql #初始化prisma工作区
# 在生成的.env中修改为我们在postgres中创建的用户信息：
# DATABASE_URL="postgresql://prompt_user:password123@localhost:5432/prompt_journal_db?schema=public"
```

### 定义数据模型（编写Scheme）
这一步告诉Prisma我们要建立什么表
修改```prisma/schema.prisma```为：
```js
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

// 1. 枚举类型 (Postgres 特性)
enum UserRole {
  ADMIN
  USER
}

// 2. 用户模型 -> 对应数据库的 "User" 表
model User {
  id        Int      @id @default(autoincrement()) // 主键，自增 ID
  email     String   @unique                       // 唯一索引
  password  String
  role      UserRole @default(USER)                // 默认是普通用户
  
  prompts   Prompt[] // 这里定义了一对多关系：一个用户拥有多个 Prompt

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// 3. Prompt 模型 -> 对应数据库的 "Prompt" 表
model Prompt {
  id        Int      @id @default(autoincrement())
  title     String
  content   String   @db.Text // 指定用数据库的 Text 类型存长文本
  tags      Json?    // 指定用 JSON 类型存标签 (如 ["AI", "Code"])
  
  // 外键关联
  userId    Int
  user      User     @relation(fields: [userId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 创建 prisma.config.mjs 
```bash
$ touch prisma.config.mjs
```
在api目录下创建prisma.config.mjs配置文件，写入以下内容：
```ts
// apps/api/prisma.config.mjs
import 'dotenv/config'; // 显式加载环境变量

export default {
  // Prisma 7 新标准：在这里配置数据源
  datasource: {
    url: process.env.DATABASE_URL
  }
};
```

### 执行迁移并生成客户端
```
$ npx prisma migrate dev --name init
$ npx prisma generate
```

### 测试ts与数据库交互
在```api/src/```创建test-db.ts,写入以下内容：
```ts
// apps/api/src/test-db.ts
import 'dotenv/config'; 
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg'; // 引入适配器
import { Pool } from 'pg'; // 引入原生驱动

// 1. 准备连接池
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('❌ 环境变量未加载');

const pool = new Pool({ connectionString });

// 2. 创建适配器
const adapter = new PrismaPg(pool);

// 3. 初始化 Prisma (传入 adapter)
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 开始连接数据库 (Adapter模式)...');

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

  console.log('✅ 成功写入数据:', newUser);
  
  const count = await prisma.user.count();
  console.log(`📊 数据库当前用户数: ${count}`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // 记得关闭连接池
  });
```
测试效果：
```bash
$  npx tsx src/test-db.ts
 开始连接数据库 (Adapter模式)...
√ 成功写入数据: {
  id: 1,
  email: 'adapter_test_1765466263747@example.com',
  password: 'password_modern_way',
  role: 'USER',
  createdAt: 2025-12-11T15:17:44.114Z,
  updatedAt: 2025-12-11T15:17:44.114Z
}
 数据库当前用户数: 1
```


### Day2总结

*   ✅ **工程化**：搭建了标准的 pnpm Monorepo 结构，配置了 TS 继承。
*   ✅ **新特性适配**：在 Prisma 7 的破坏性更新面前，没有降级，而是通过查阅报错，配置了 ESM 模块和驱动适配器。
*   ✅ **数据库实战**：完成了 Schema 设计、迁移 (Migration) 和 初步实现ts与数据库的交互。
