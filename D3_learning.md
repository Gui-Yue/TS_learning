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

