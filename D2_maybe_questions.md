### 第一板块：ORM 与 数据库架构 (核心重灾区)

#### Q1: 为什么选择 Prisma？它和你用过的 GORM (Go) 或 SQLAlchemy (Python) 有什么本质区别？
*   **考察点**：对“Schema First”理念的理解。
*   **参考回答**：
    *   **核心区别**：Prisma 是 **Schema First (蓝图优先)** 的，而 GORM/SQLAlchemy 通常是 **Code First (代码优先)**。
    *   **详细解释**：
        *   在 Go/Python 中，我们通常定义 Struct/Class，然后映射到数据库。
        *   在 Prisma 中，唯一的真理来源是 `schema.prisma` 文件。我们先写 DSL (领域特定语言) 描述表结构，Prisma 自动帮我们做两件事：
            1.  **向左**：生成 SQL 迁移数据库。
            2.  **向右**：生成完全类型安全的 TypeScript 客户端代码 (`node_modules/@prisma/client`)。
    *   **优势**：这解决了“代码定义”和“数据库实际结构”不一致的问题，且提供了极致的自动补全体验。

#### Q2: 你在项目中使用了 `@prisma/adapter-pg` (Driver Adapter)，为什么要这么做？直接传 `DATABASE_URL` 字符串不行吗？
*   **考察点**：对 **Prisma 7 新特性** 及 **Serverless 架构** 的理解。（这是加分题！）
*   **参考回答**：
    *   **旧模式 (传字符串)**：Prisma 引擎（Rust二进制）直接通过 TCP 连接数据库。这在传统的长运行服务器（VPS/EC2）上没问题。
    *   **新模式 (Driver Adapter)**：Prisma 7 引入了适配器模式，允许我们将底层的数据库驱动（如 `pg` 库）注入到 Prisma 中。
    *   **核心价值**：
        1.  **Serverless 兼容性**：在 Vercel/Cloudflare Workers 等 Serverless 环境中，我们无法运行 Rust 二进制文件或建立持久 TCP 连接。适配器允许 Prisma 使用轻量级的 JS 驱动甚至 HTTP 协议连接数据库。
        2.  **连接池控制**：我们可以显式复用 `pg.Pool`，对数据库连接数有更精细的控制，防止 Serverless 函数爆发时耗尽数据库连接。

#### Q3: `prisma migrate dev` 和 `prisma generate` 分别干了什么？
*   **考察点**：工作流原理。
*   **参考回答**：
    *   **`migrate dev` (动数据库)**：读取 `schema.prisma`，生成 SQL 文件，并在**数据库**里执行建表/改表操作。它通常会自动触发 generate。
    *   **`generate` (动代码)**：读取 `schema.prisma`，生成 TypeScript 的类型定义文件 (`.d.ts`) 到 `node_modules` 里。
    *   **踩坑经验**：有时候代码报“找不到类型”，是因为只跑了迁移但没跑 generate，或者编辑器缓存没更新。

---

### 第二板块：工程化与 Node.js 运行时

#### Q4: 你的 `prisma.config.mjs` 为什么要用 `.mjs` 后缀？Node.js 的 ESM 和 CommonJS 有什么区别？
*   **考察点**：Node.js 基础知识。
*   **参考回答**：
    *   **原因**：Prisma 7 是原生 ESM 模块，为了正确加载配置，我使用了 `.mjs` 明确告诉 Node.js 这是一个 ECMAScript Module。
    *   **区别**：
        *   **CommonJS (CJS)**: 传统的 Node 规范，使用 `require()` 和 `module.exports`。是**同步加载**的。
        *   **ESM**: 现代标准，使用 `import` 和 `export`。是**静态解析/异步加载**的，支持 Tree-shaking（摇树优化）。
    *   **现状**：现在的 Node.js 生态正在全面转向 ESM，也就是 `type: "module"`。

#### Q5: 为什么要使用 Monorepo (pnpm workspace)？
*   **考察点**：架构设计能力。
*   **参考回答**：
    *   **目的**：将前端 (`apps/web`) 和后端 (`apps/api`) 放在同一个仓库里管理。
    *   **好处**：
        1.  **配置共享**：前后端都继承根目录的 `tsconfig.json`，保证代码规范一致（ES2022, Strict Mode）。
        2.  **类型复用**：未来前端可以直接引用后端的类型定义（Zod Schema），实现“修改一处，前后端同时报错”，避免接口不对齐的 Bug。
        3.  **依赖管理**：`pnpm` 通过硬链接机制，节省磁盘空间，安装速度极快。

---

### 第三板块：数据库设计 (PostgreSQL)

#### Q6: 为什么在这个项目中选择 PostgreSQL 而不是 MySQL 或 MongoDB？
*   **考察点**：技术选型逻辑。
*   **参考回答**：
    *   **对比 MySQL**：Postgres 的 SQL 标准兼容性更好，且支持更丰富的数据类型。
    *   **核心优势 (本项目用到)**：
        1.  **JSONB 支持**：我在 `Prompt` 表里使用了 `Json` 类型来存标签 (`tags`)。PG 的 JSONB 性能极高，支持索引查询，这让我既拥有关系型数据库的事务安全性，又拥有 NoSQL 的灵活性（Schema-less）。
        2.  **Enum 支持**：我在 `User` 表里使用了原生 `Enum` (UserRole)，这比在应用层校验字符串更高效且安全。

---