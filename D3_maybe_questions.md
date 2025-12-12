今天打通了 **API 接口 + 运行时校验 + 数据库单例** 这三关，这是后端开发中最核心的业务流程。

针对今天的内容，面试官通常会侧重于考察你对 **“TypeScript 类型系统局限性”** 的理解，以及 **“工程化架构设计”** 的能力。

以下是为你定制的面试题集，结合了 Python/Go 背景：

---

### 🔥 核心必考题 (Zod 与 类型系统)

#### Q1: 既然 TypeScript 已经是强类型的了，为什么我们还需要引入 Zod？(最重要的概念题)
*   **考察点**：是否理解 **编译时(Compile Time)** 与 **运行时(Runtime)** 的区别。
*   **参考回答**：
    *   **TypeScript 的局限**：TS 的类型检查只存在于编译阶段。代码编译成 JavaScript 运行在 Node.js 中时，所有 `interface` 和类型标注都会被擦除。
    *   **外部数据的不可控性**：API 接收到的 JSON 数据（`request.body`）是 `any` 或 `unknown` 的。如果用户传了 `age: "20"` (字符串)，Node.js 运行时不会报错，但这可能导致后续逻辑崩溃。
    *   **Zod 的作用**：Zod 运行在 JS 运行时。它像一个守门员，强制检查传入的数据是否符合规则。
    *   **类比**：这就像 Python 的 Type Hints (静态) 和 Pydantic (运行时) 的区别。

#### Q2: 在今天的 Fastify 代码中，我们没有手动定义 `interface CreatePromptRequest`，为什么编辑器能自动推导出 `request.body` 的类型？
*   **考察点**：对 TS **类型推导 (Type Inference)** 的理解。
*   **参考回答**：
    *   这是使用了 `fastify-type-provider-zod` 插件的效果。
    *   **原理**：Zod 提供了 `z.infer<typeof Schema>` 能力，可以从 Schema 自动生成 TS 类型。
    *   **胶水层**：插件利用 TS 的泛型能力，把 Zod 推导出的类型自动绑定到了 Fastify 的 `request` 对象上。
    *   **价值**：实现了 **Single Source of Truth (唯一真理源)**。我们只需要维护一份 Zod Schema，文档校验和代码类型就全部自动同步了。

#### Q3: Zod 的 `.parse()` 和 `.safeParse()` 有什么区别？你会怎么选？
*   **考察点**：错误处理策略。
*   **参考回答**：
    *   **`.parse()`**：严格模式。校验失败会直接**抛出异常 (Throw Error)**。
        *   *场景*：通常用于 API 顶层（配合 Fastify 这种能自动捕获错误的框架），或者当你确定数据必须正确否则程序无法继续时。
    *   **`.safeParse()`**：安全模式。不会抛出异常，而是返回一个包含 `success: boolean` 的结果对象。
        *   *场景*：用于处理复杂的业务逻辑，比如不想中断程序，而是想手动收集错误信息返回给前端，或者处理可选配置文件时。
    *   **Go 视角**：`.safeParse()` 就像 Go 的 `val, err := validate(...)` 模式，由开发者显式处理错误。

---

### 🏛️ 架构设计题 (Fastify & Prisma)

#### Q4: 为什么要专门把 PrismaClient 的初始化逻辑封装成单例 (Singleton)？直接在路由里 `new PrismaClient()` 不行吗？
*   **考察点**：对数据库连接池 (Connection Pool) 的理解。
*   **参考回答**：
    *   **后果**：如果在路由里 `new`，每次 HTTP 请求都会创建一个新的数据库连接池实例。在高并发下，这会迅速耗尽数据库的连接数限制（`Too many connections`），导致服务崩溃。
    *   **开发环境问题**：特别是在开发环境（使用 `tsx watch` 热重载）时，每次文件修改都会重新执行代码。如果不使用 `globalThis` 挂载单例，每次热重启都会残留旧的连接，导致连接数泄露。
    *   **Go 视角**：这就像在 Go 里，我们会在 `main` 函数或者 `init` 阶段初始化一个全局的 `*sql.DB` 对象，而不是在每个 `http.Handler` 里去 Open 数据库。

#### Q5: 你是如何在 Fastify 中处理 API 错误响应的？(比如 Validation Error)
*   **考察点**：框架的使用经验。
*   **参考回答**：
    *   我使用了 `fastify-type-provider-zod`。当请求参数不符合 Zod Schema 时，Fastify 会自动拦截请求，不会进入业务逻辑，并自动返回 **400 Bad Request**。
    *   它返回的 JSON 结构包含了具体的错误字段和原因（Zod Error Format），这省去了我在每个 Controller 里手动写 `if (!body.title) return 400` 的重复代码。

---

### 💡 自测小作业

今晚睡觉前，试着不看答案，在脑海里回答这个问题：

> **“如果我要给 Prompt 表增加一个 `isPublic` (布尔值) 字段，我需要改哪些文件？流程是怎样的？”**

**标准答案思路**：
1.  改 **Prisma Schema** (`schema.prisma`) -> 加字段。
2.  跑 **Migration** (`npx prisma migrate dev`) -> 同步数据库 & 生成 TS 类型。
3.  改 **Zod Schema** (`src/routes/prompts.ts`) -> 允许 API 接收这个字段。
4.  改 **API 逻辑** -> 在 `prisma.create` 的时候把这个字段存进去。

能流畅说出这个流程，说明真正掌握了这套技术栈！