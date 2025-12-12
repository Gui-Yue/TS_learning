// apps/api/src/learn-zod.ts
import { z } from 'zod';

// --- 1. 定义Schema ---
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