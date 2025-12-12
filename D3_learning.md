###  Day 3 学习任务概览
 **运行时校验 (Zod)**
    目标：实现 API 入参校验。
    *对标*：类似 Python 的 **Pydantic**。
***Fastify CRUD 实战***
    目标：结合 Fastify + Zod + Prisma，写出 POST /prompts (增) 和 GET /prompts (查)。

### Zod 独立运行测试
#### zod是什么？
Zod 是一个以 TypeScript 为核心的“运行时数据校验库”。
简单的说：它是一个 **“门卫”**。TypeScript 是建筑蓝图（编译时检查），告诉工人墙要砌多高；而 Zod 是现场监理（运行时检查），拿着尺子去测量运进来的砖头合不合格。如果不合格，它直接把砖头扔出去，不让进工地。
#### 为什么要用zod？
TypeScript 的局限：TS 的类型检查只在编译时存在。一旦代码编译成 JavaScript 运行在 Node.js 里，所有类型信息全部消失
***危险场景***：
 API 规定 age 必须是正整数。
前端（或恶意用户）发来一个 JSON：{"age": "20"} (字符串) 或者 {"age": -5}。
Node.js 运行时根本不知道 age 应该是数字，直接拿去计算，导致数据库报错或逻辑崩溃。
#### Zod标准使用流程
1、定义Schema
创建一个Zod对象，描述你想要的数据长啥样。
```ts
import { z } from 'zod';

// 1. 定义规则：必须是对象，包含 username(字符串) 和 age(数字)
const UserSchema = z.object({
  username: z.string().min(3), // 链式调用：字符串 -> 最小长度3
  age: z.number().max(100)     // 数字 -> 最大100
});
```
2、推导类型
这一步不需要手写新的接口，Zod可以从上面的Schema中提取出TS类型
```ts
// 2. 自动生成 TS 类型
// type User = { username: string; age: number }
type User = z.infer<typeof UserSchema>;
```
好处：以后改了 Schema（比如 age 变成字符串），这个 Type 自动跟着变。Single Source of Truth（唯一真理源）。
3. 执行校验
当外部数据（API 请求体）进来时，用模具去“套”它。
```ts
// 3. 校验数据
const input = request.body; // 假设这是前端传来的未知数据

// 方式 A：严格模式 (parse) - 不通过直接抛异常 (500 Error)
try {
  const data = UserSchema.parse(input);
  // data 在这里就是绝对安全的 User 类型
} catch (e) {
  // 处理错误
}

// 方式 B：安全模式 (safeParse) - 返回成功/失败结果对象 (推荐)
const result = UserSchema.safeParse(input);
if (!result.success) {
  console.log(result.error); // 打印错误原因
} else {
  console.log(result.data);  // 处理干净的数据
}
```
#### zod实践
在根目录中添加zod包
```bash
$ pnpm add zod
```
在后端目录中添加一个新的ts文件
```bash
$ touch apps/api/src/test-zod.ts
```

在文件中写入以下内容：
```ts
// apps/api/src/learn-zod.ts
import { z } from 'zod';

// --- 1. 定义模具 (Schema) ---
// 就像你在 Python 里写 class User(BaseModel)
const UserSchema = z.object({
  username: z.string().min(3, "用户名太短，至少3位"), // 必须是字符串，且长度>=3
  email: z.string().email("不是有效的邮箱"),          // 必须符合邮箱格式
  age: z.number().optional(),                        // 可选的数字 (可以是 undefined)
  tags: z.array(z.string()),                         // 必须是字符串数组
});

// --- 2. 见证魔法：自动推导 TS 类型 ---
// 以后你修改了上面的 Schema，这个 User 类型会自动更新，不用改两遍代码
type User = z.infer<typeof UserSchema>;

// --- 3. 准备一条“脏数据” (模拟前端传来的错误参数) ---
const dirtyData = {
  username: "ab",         // ❌ 错误：只有2位，不满足 min(3)
  email: "not-an-email",  // ❌ 错误：不是邮箱格式
  // age 缺失 (✅ 合法，因为是 optional)
  tags: [123]             // ❌ 错误：数组里混入了数字，必须全是字符串
};

console.log("--- 1. 开始校验脏数据 ---");

// 使用 safeParse：它不会抛出异常让程序崩溃，而是返回一个结果对象
const result = UserSchema.safeParse(dirtyData);

if (!result.success) {
  console.log("❌ 拦截成功！Zod 发现了以下问题：");
  // format() 会把错误信息整理成人类可读的结构
  console.log(JSON.stringify(result.error.format(), null, 2));
}

// --- 4. 准备一条“干净数据” ---
const goodData = {
  username: "ShadowWalker",
  email: "test@example.com",
  tags: ["Coder", "Gamer"]
};

console.log("\n--- 2. 开始校验正确数据 ---");

const cleanResult = UserSchema.safeParse(goodData);
if (cleanResult.success) {
  // result.data 就是清洗后、类型安全的 User 对象
  console.log("✅ 校验通过，数据如下:", cleanResult.data);
}
```
执行它，可以看到效果：
```bash
$ npx tsx ./src/test-zod.ts
--- 1. 开始校验脏数据 ---
❌ 拦截成功！Zod 发现了以下问题：
{
  "_errors": [],
  "username": {
    "_errors": [
      "用户名太短，至少3位"
    ]
  },
  "email": {
    "_errors": [
      "不是有效的邮箱"
    ]
  },
  "tags": {
    "0": {
      "_errors": [
        "Invalid input: expected string, received number"
      ]
    },
    "_errors": []
  }
}

--- 2. 开始校验正确数据 ---
✅ 校验通过，数据如下: {
  username: 'ShadowWalker',
  email: 'test@example.com',
  tags: [ 'Coder', 'Gamer' ]
}
```
### 构建类型安全的CRUD API
在本阶段我们要把“Zod 的校验能力”和“Prisma 的数据库能力”结合到 Fastify 服务器里。
先完成两个准备工作：”安装插件“&”封装数据库连接“
#### 安装Fastify的Zod适配器
我们需要一个“胶水”库，让 Fastify 能直接读懂 Zod 的 Schema，并自动生成 Swagger 文档。
```bash
# 在apps/api目录下
$ pnpm add fastify-type-provider-zod
```
#### 封装Prisma 单例 
在 Web 开发中，最忌讳的就是“每次请求都 new 一个数据库连接”。这会迅速耗尽数据库的连接池。
我们需要把昨天 test-db.ts 里写的连接逻辑提取出来，变成一个全局共享的模块。
```bash
$ mkdir -p src/lib && touch src/lib/db.ts
```
在src/lib/db.ts中写入：
```ts
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
```

### 编写业务路由（CRUD）
可以将路由逻辑单独放在一个文件中。
```bash
$ mkdir -p src/routes && touch src/routes/prompts.ts
```
在文件中写入：
```ts
// apps/api/src/routes/prompts.ts
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../lib/db'; // 导入刚才封装的单例

export async function promptRoutes(app: FastifyInstance) {
  // 关键动作：让这个 Fastify 实例“变身”，拥有 Zod 的类型推导能力
  const server = app.withTypeProvider<ZodTypeProvider>();

  // --- 1. POST /prompts (新增) ---
  server.post(
    '/prompts',
    {
      schema: {
        // 定义 Body 的校验规则 (Zod Schema)
        body: z.object({
          title: z.string().min(1, "标题不能为空"),
          content: z.string().min(1, "内容不能为空"),
          tags: z.array(z.string()).optional(), // 可选的标签数组
        }),
      },
    },
    async (request, reply) => {
      // ✨ 见证奇迹 ✨
      // 把鼠标悬停在下面的 title, content 上
      // 编辑器知道它们是 string，绝对不可能是 undefined 或 number
      const { title, content, tags } = request.body;

      try {
        const newPrompt = await prisma.prompt.create({
          data: {
            title,
            content,
            tags: tags ?? [], // 如果 tags 是 undefined，给个默认空数组
            userId: 1,        // 暂时硬编码为 ID=1 (Day 2 创建的那个用户)
          },
        });
        
        // 返回 201 Created
        return reply.status(201).send(newPrompt);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: '创建失败' });
      }
    }
  );

  // --- 2. GET /prompts (查询列表) ---
  server.get('/prompts', async (request, reply) => {
    const prompts = await prisma.prompt.findMany({
      orderBy: { createdAt: 'desc' }, // 按时间倒序
      take: 50,                       // 最多取 50 条
      include: { 
        // 联表查询：顺便把作者的邮箱查出来
        user: { 
          select: { email: true, role: true } 
        } 
      }
    });
    return prompts;
  });
}
```
#### 在入口处注册路由
修改src/index.ts,将Zod的编译器和刚写的路由挂载上去：
新的api/src/index.ts文件如下：
```ts
// apps/api/src/index.ts
import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { promptRoutes } from './routes/prompts'; // 导入刚才写的路由

const server = Fastify({ logger: true });

// 1. 配置 Zod 编译器 (必须配置，否则 Fastify 不认识 Zod Schema)
server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

// 2. 注册业务路由
server.register(promptRoutes);

// 3. 启动服务
const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server running at http://localhost:3001');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
```
#### 启动服务并测试
```bash
$ pnpm dev

# 在另一个终端测试api是否正确响应
$ curl -X POST http://localhost:3001/prompts \
  -H "Content-Type: application/json" \
  -d '{"title": "", "content": "test"}'

  # 会报错400，因为空标题

$ curl -X POST http://localhost:3001/prompts \
  -H "Content-Type: application/json" \
  -d '{"title": "API Test", "content": "Hello from Curl", "tags": ["api"]}'
  # 返回新创建的 prompt JSON

$ curl http://localhost:3001/prompts
  # 返回包含刚才那条数据的数组。
```
