# 安装工具链 
1. 安装Node.js
本机已安装nodejs的22.17版本，最新稳定版本为24.11，因此采用nvm对nodejs进行更新。
```bash
# 当前版本
$ node -v
v22.17.0
$ nvm -v
0.40.3

更新到最新版本：
$ nvm install 24
Downloading and installing node v24.11.1...
Downloading https://nodejs.org/dist/v24.11.1/node-v24.11.1-linux-x64.tar.xz...
############################################################################################################################################################################# 100.0%
Computing checksum with sha256sum
Checksums matched!
Now using node v24.11.1 (npm v11.6.2)
# 切换到该版本
$ nvm use 24
Now using node v24.11.1 (npm v11.6.2)
# 设置为默认版本
$ nvm alias default 24
default -> 24 (-> v24.11.1)
$ node -v
v24.11.1
```
2. 安装并配置 pnpm
```bash
# 启用 Corepack(nodejs内置了一个叫 Corepack 的工具，专门用来管理 pnpm 这种包管理器)
$ corepack enable
# 激活最新版 pnpm
$ corepack prepare pnpm@latest --activate
Preparing pnpm@latest for immediate activation...
# 验证安装结果
$ pnpm -v
10.25.0
```
至此，环境配置完成

# 初始化项目
这一步的目标是生成项目的“身份证”（package.json）并安装必要的开发工具。
```bash
# 创建并进入项目目录
$ mkdir prompt-journal && cd prompt-journal
# 初始化项目配置（生成package.json文件）
# 类似于Go 的 go mod init 或 Python 的 poetry init。生成的 package.json 记录了项目名称和未来的依赖包。
$ pnpm init
# 安装 TypeScript 开发工具链（安装编译器、运行器和 Node 类型定义。）
$ pnpm add -D typescript tsx @types/node

# note: 
# -D (Dev Dependencies)：表示这些包只在开发时用（比如编译器），上线打包后不需要。类似 Python 的 requirements-dev.txt。
# tsx：这是 TypeScript 的“解释器”，让你能直接运行 .ts 文件（tsx main.ts），省去了手动编译成 .js 再运行的麻烦。
# @types/node：因为 JS 是弱类型的，这个包给 Node.js 的标准库（如文件读写、HTTP）加上了类型说明，让编辑器能自动补全。
```

# 配置TypeScript编译器（tsconfig.json）
```bash
# 1. 生成默认配置文件
npx tsc --init
# 2. 修改生成的配置文件为所需要的配置。
```
我的配置如下所示：
```json
{
  "compilerOptions": {
    /* --- 基础环境配置 --- */
    // 目标代码版本：Node 24 支持最新的 ES2022/ES2023 特性，
    // 所以我们不需要把代码“降级”编译成旧的 ES5/ES6，保持原生语法即可。
    "target": "ES2022",
    
    // 模块系统：告诉 TS 我们在用 Node.js 的现代模块标准
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    
    /* --- 严格模式 --- */
    "strict": true,  
    // 开启 strict 等于同时开启了：
    // - noImplicitAny: true (禁止隐式 any，类似 Python 强制类型标注)
    // - strictNullChecks: true (变量默认不能是 null/undefined，类似 Go 的指针检查)

    /* --- 输出配置 --- */
    "outDir": "./dist",       // 编译后的 .js 文件放哪里
    "sourceMap": true,        // 生成映射文件，方便断点调试
    
    /* --- 互操作性 --- */
    "esModuleInterop": true,  // 允许 import x from 'commonjs-lib'
    "skipLibCheck": true,     // 跳过依赖库的类型检查 (为了编译速度)
    "forceConsistentCasingInFileNames": true // 强制文件名大小写一致 (Linux下很重要)
  },
  "include": ["src/**/*"]     // 只编译 src 目录下的文件
}
```
现在我要验证两件事：
1. tsx 能否正确调用 Node.js 运行 TypeScript 代码。
2. tsconfig.json 的配置是否生效（虽然 Hello World 看不出来配置差异，但能保证路径没问题）。

```bash
# 创建源码目录（将源码和配置文件分开）
$ mkdir src
# 编写Hello World
$ touch src/index.ts # 类似于main.go,__init__.py是程序入口的约定命名
```
写入index.ts的helloword代码：
```ts
// src/index.ts
const message: string = "Hello, TypeScript on Node 24!";
// note:  ": string"是 TypeScript 的核心——类型标注。
// 如果将message的值改为数字，编辑器会立刻标红报错（静态类型检查）
console.log(message);
```
完成后可以测试其是否能正常运行：
```bash
$ npx tsx src/index.ts
Hello, TypeScript on Node 24!
```
至此，环境搭建部分已经完成，接下来需要开始真正的typescript核心概念的正式学习。

# 三个核心概念
## Interface(接口) ——定义形状
```ts
interface BaseUser {
    id: number;
    username: string;
    email?: string; //[?]表示可选
    createdAt: Date; //Date是内置的标准引用类型，用于处理日期和时间。
}
```
Interface类似于golang中的Struct结构体。但是有区别，区别在于golang中定义不同的结构体，哪怕其中的字段相同，它们也是不同的类型，不过在ts中，只要长得一样那么它们就是同一个类型，不管它们原本叫什么。
***定义***： 它是一份“契约”，规定了一个对象必须有哪些字段，以及每个字段是什么类型。

## Intersection(交叉类型 & ) ——拼积木
```ts
type AdminUser = BaseUser & {
  role: 'admin';      // 字面量类型：值只能是字符串 "admin"
  adminLevel: number; // 管理员独有的字段
};

type RegularUser = BaseUser & {
  role: 'user';       // 值只能是 "user"
  vipStatus: boolean; // 普通用户独有的字段
};
```
Intersection 类似于golang中的结构体嵌入，该类型的作用在于“拼积木”。
***定义***：type A = B & {C} 意味着定义的A拥有B的所有字段以及C中的所有字段
为便于理解可以与golang进行对比：
```go
// Go 写法
type BaseUser struct { ID int }
type AdminUser struct {
    BaseUser // 嵌入！自动拥有 ID 字段
    Level int
}
```
```ts
// typescript写法
interface BaseUser {
    ID: number;
}
type AdminUser = BaseUser & {
    Level: number;
}
```

## Union (联合类型 |) —— “薛定谔的类型”
```ts
// 我们定义的“应用用户”：要么是管理员，要么是普通用户。
type AppUser = AdminUser | RegularUser; 
```
联合类型 “|” 与Go/Python具有巨大的差异，也是其表达能力最强的地方
***含义***: ```A|B```意味着这个变量在某一时刻，要么是A，要么是B。

# 模拟数据与业务逻辑的编写

当我们通过上述三个核心概念定义完数据类型，现在我们就能通过数据编写一些运作逻辑了：
```ts
// --- 模拟数据 ---
// 定义一个用户数组
const users: AppUser[] = [
  {
    id: 1,
    username: "root",
    role: "admin",       // 必须匹配 'admin'
    adminLevel: 99,
    createdAt: new Date(),
  },
  {
    id: 2,
    username: "gxw",
    role: "user",        // 必须匹配 'user'
    vipStatus: true,
    createdAt: new Date(),
  }
];

// --- 业务逻辑：类型收窄 (Type Narrowing) ---
function printUserInfo(user: AppUser) {
  // 此时，user 可能是 Admin，也可能是 Regular
  // 如果直接访问 user.adminLevel，编译器会报错！因为 RegularUser 没有这个字段。

  console.log(`Checking user: ${user.username}`);

  // Go视角: 这就像 switch user.(type)
  // TS 极其智能：它发现我们判断了 role 字段
  if (user.role === 'admin') {
    // 在这个 if 块里，TS 100% 确定 user 是 AdminUser
    // 所以可以安全访问 adminLevel
    console.log(`   [Admin] Level: ${user.adminLevel}`);
  } else {
    // 既然不是 admin，那剩下的可能性只能是 RegularUser
    // 所以这里自动拥有 vipStatus
    console.log(`   [User] VIP: ${user.vipStatus}`);
  }
}

// --- 运行 ---
users.forEach(u => printUserInfo(u));
```

# 补充ts基础知识

为了避免“知识空心化”，用**一张全景图**把 TypeScript 的核心语法体系铺开。用 **Python (Py)** 和 **Go (Go)** 做对标，帮助理解。

新建文件 `src/cheatsheet.ts`，这里面的代码包含了需要掌握的 90% 的语法。

---

### 一、变量声明关键字：`const` vs `let`

在 JS/TS 世界里，只需要关注两个词：

*   **`const`** (常量/不可变绑定)
    *   **规则**：声明时必须赋值，且后续不能重新赋值（引用类型可以改内部属性）。
    *   **Go 对比**：类似 `const`，但 Go 的 const 只能是基本类型，TS 的 `const` 可以是对象/数组。
    *   **范式**：**95% 的情况都用 `const`**。默认不可变能减少 Bug。
*   **`let`** (变量)
    *   **规则**：块级作用域，可以重新赋值。
    *   **Go 对比**：类似 `var` 或 `:=`。
    *   **场景**：只有当确定这个值待会儿会变（比如循环计数器 `i++`）时才用。

```typescript
// ✅ 推荐
const maxRetries = 5;
const user = { name: "Gxw" };
user.name = "New Name"; // ✅ 合法！const 锁的是 user 这个引用地址，没锁内容
// user = { name: "B" }; // ❌ 报错：不能把 user 指向新对象

// ⚠️ 仅在需要时
let counter = 0;
counter++;
```

---

### 二、常用关键字清单 (Keywords Cheat Sheet)

将关键字按功能分类。仔细阅读并建立映射：

#### 1. 类型定义相关
*   **`interface`**: 定义对象形状（Go `struct`）。
*   **`type`**: 定义别名、联合类型 (`|`)、交叉类型 (`&`)。
*   **`enum`**: 枚举（Go `const` block, Python `Enum`）。
*   **`as`**: 类型断言（Go `interface.(Type)`）。
    *   *用法*：`const input = someVar as string;` (告诉编译器：闭嘴，我知道它是 string)。

#### 2. 逻辑控制相关
*   **`if`, `else`, `switch`**: 和 Go/Python 几乎一样。
*   **`for`, `while`**: 循环。
*   **`try`, `catch`, `finally`**: 异常处理（Python `try/except/finally`）。TS 必须捕获错误，不像 Go 用 `if err != nil`。

#### 3. 模块化相关 (ESM)
*   **`import`**: 引入模块（Python `import`, Go `import`）。
*   **`export`**: 导出模块（Go 首字母大写）。
*   **`default`**: 默认导出（Python 没有直接对应，类似导出一个主对象）。

#### 4. 异步相关
*   **`async`**: 标记函数为异步（Python `async def`）。
*   **`await`**: 等待 Promise 结果（Python `await`）。

---

### 三、逻辑判断与循环 (编写范式)

这是 TS 与 Go/Python 风格差异最大的地方。

#### 1. 判断：三元运算符 vs `if`
TS 社区非常喜欢三元运算符，因为它可以用在表达式里（比如 React 的 JSX 中）。

```typescript
const age = 20;
let status = "";

// Go 写法 (指令式)
if (age >= 18) {
    status = "Adult";
} else {
    status = "Kid";
}

// TS 常用写法 (声明式/函数式)
const status = age >= 18 ? "Adult" : "Kid";
```

#### 2. 判断：`==` vs `===` (千万注意！)
*   `==` (双等): 会进行**类型转换**。`"1" == 1` 是 `true`。**永远别用！**
*   **`===` (三等)**: 严格相等（值和类型都要一样）。`"1" === 1` 是 `false`。**永远用这个！**
    *   *Python/Go 默认就是三等逻辑。*

#### 3. 循环：`for...of` vs 函数式编程
TS 开发者**很少写传统的 `for (let i=0; i<n; i++)`**。

*   **遍历数组 (Python `for x in list`)**:
    ```typescript
    const items = ["a", "b", "c"];
    
    // 写法 1: for...of (指令式)
    for (const item of items) {
        console.log(item);
    }
    
    // 写法 2: .map / .forEach (函数式 - React中极常用)
    // 类似于 Python 的列表推导式: [x.upper() for x in items]
    const upperItems = items.map(item => item.toUpperCase());
    ```

*   **遍历对象 (Python `for k,v in dict.items()`)**:
    ```typescript
    const dict = { a: 1, b: 2 };
    // Object.entries 变成 [[k,v], [k,v]]
    for (const [key, val] of Object.entries(dict)) {
        console.log(key, val);
    }
    ```

---

### 四、综合演练 (Coding Paradigm)

请将以下代码复制到 `src/cheatsheet.ts` 并运行。这段代码展示了**现代 TS 编程范式**：
1.  **强类型定义** (Interface/Type)。
2.  **函数式处理** (Map/Filter 代替 For 循环)。
3.  **异步处理** (Async/Await 代替回调)。
4.  **错误处理** (Try/Catch)。

```typescript
// src/cheatsheet.ts

// 1. 类型定义
type Status = "active" | "inactive";

interface Task {
  id: number;
  title: string;
  status: Status;
  completedAt?: Date; // 可选
}

// 模拟数据库数据
const mockTasks: Task[] = [
  { id: 1, title: "Learn TS", status: "active" },
  { id: 2, title: "Sleep", status: "inactive" },
  { id: 3, title: "Eat", status: "active" },
];

// 2. 异步函数 (async)
// 模拟 API 调用，返回 Promise
async function fetchTasks(): Promise<Task[]> {
  // 模拟网络延迟
  // Promise 是 JS 异步的核心，类似 Go 的 Goroutine 结果通道，但在单线程里跑
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockTasks);
    }, 500); // 0.5秒后返回
  });
}

// 3. 主逻辑
async function main() {
  console.log("⏳ Fetching tasks...");

  try {
    // await: 暂停在这里，直到数据回来（Python await 行为一致）
    const tasks = await fetchTasks();

    // --- 编写范式：函数式链式调用 ---
    // 目标：找到所有 active 的任务，把标题改成大写
    
    // Go 思路: make slice -> for range -> if -> append
    // TS 思路 (Map/Filter/Reduce):
    const activeTitles = tasks
      .filter(t => t.status === "active")  // 1. 过滤
      .map(t => t.title.toUpperCase());    // 2. 映射(转换)

    console.log("✅ Active Tasks:", activeTitles);

    // --- 常用判断逻辑 ---
    
    // 空值合并 (??): 如果 activeTitles[0] 不存在，显示 "None"
    const firstTask = activeTitles[0] ?? "None";
    console.log(`First Task: ${firstTask}`);

    // 三元运算符
    const hasMany = activeTitles.length > 5 ? "Busy Day" : "Easy Day";
    console.log(`Status: ${hasMany}`);

  } catch (error) {
    // 必须捕获 Promise 可能抛出的 reject
    console.error("❌ Error:", error);
  }
}

// 执行
main();
```

---

### 📝 总结：TS 编写范式核心
对于我（Python/Go 转 TS），最大的思维转变只有两点：

1.  **从“指令式”转“声明式”**：
    *   少写 `for` 循环，多写 `data.map()` 和 `data.filter()`。
    *   不要手动维护状态变化步骤，而是描述“输入数据 -> 转换 -> 输出数据”的管道。
2.  **拥抱异步**：
    *   Go 是同步代码看似并发（Goroutines）。
    *   TS 是全异步。读文件、请求 API、查数据库，全部都是 `Promise`，全部要 `await`。

**现在的这套“语法武器库”已经足够支撑完成后面的实战了。运行 `npx tsx src/cheatsheet.ts`并理解输出，我们就可以安心结束基础补课，在 D2 直接开始写后端接口了！**