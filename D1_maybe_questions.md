
### 第一部分：核心概念（必问）

#### Q1: `interface` 和 `type` 有什么区别？你平时怎么选？
*   **考察点**：是否理解 TS 的两种定义方式。
*   **参考回答**：
    *   **区别**：
        1.  `interface` 主要用于定义对象形状（类似 Go Struct），支持合并（同名 interface 会自动合并）。
        2.  `type` 能力更强，可以定义**联合类型** (`A | B`)、交叉类型 (`A & B`) 和基础类型别名，但不能被自动合并。
    *   **选择策略**：
        *   定义对象模型（User, Post）或 API 响应结构时，优先用 `interface`。
        *   定义联合类型（Status, Role）或复杂的工具类型时，必须用 `type`。

#### Q2: 解释一下 TypeScript 的“鸭子类型” (Structural Typing)？
*   **考察点**：是否理解 TS 与 Go/Java 的根本区别。
*   **参考回答**：
    *   TS 是基于**结构**的类型系统，而不是基于**名义**（Nominal）的。
    *   **Go/Java 逻辑**：如果 `UserA` 和 `UserB` 结构一样但名字不同，它们是不同类型。
    *   **TS 逻辑**：只要两个对象长得一样（属性和类型匹配），TS 就认为它们是同一个类型。这就像 Python 的鸭子类型：“如果它走起来像鸭子，叫起来像鸭子，它就是鸭子”，只不过 TS 是在编译时检查“长相”。

#### Q3: `any` 和 `unknown` 有什么区别？
*   **考察点**：类型安全意识（非常重要）。
*   **参考回答**：
    *   **`any`**：完全放弃类型检查，相当于写 Python。它会传播不安全性，甚至导致运行时崩溃（如访问不存在的方法）。
    *   **`unknown`**：类型安全的 `any`，类似 Go 的 `interface{}`。它可以是任何值，但在使用之前**必须**进行类型收窄（Type Narrowing）或断言，否则编译器不让操作。
    *   **结论**：除了极个别迁移场景，永远优先使用 `unknown`。

---

### 第二部分：工程与配置

#### Q4: `tsconfig.json` 中的 `strict: true` 具体开启了哪些检查？
*   **考察点**：是否真的动手配过环境。
*   **参考回答**：
    *   它开启了一系列严格检查，最核心的是：
        1.  **`noImplicitAny`**：禁止隐式的 `any` 类型（这就强制我们像 Go 一样给函数参数标类型）。
        2.  **`strictNullChecks`**：变量默认不能是 `null` 或 `undefined`。这避免了著名的“空指针异常”，强迫开发者显式处理空值（类似 Go 处理 `nil` 或 Rust 处理 `Option`）。

#### Q5: 什么是“类型收窄” (Type Narrowing)？举个例子。
*   **考察点**：实战逻辑能力。
*   **参考回答**：
    *   类型收窄是指 TS 根据代码逻辑（如 `if`, `switch`, `typeof`, `instanceof`），将一个宽泛的类型（如 `unknown` 或联合类型 `A | B`）推导为更精确类型的过程。
    *   **例子**：
        ```typescript
        function process(val: string | number) {
            if (typeof val === "string") {
                // 在这里 val 被收窄为 string，可以调 val.toUpperCase()
            } else {
                // 在这里 val 被收窄为 number，可以调 val.toFixed()
            }
        }
        ```

---

### 第三部分：代码实战（手写题）

#### Q6: 下面这段代码有什么问题？如何修复？
```typescript
function printId(id: number | string) {
  console.log("Your ID is: " + id.toUpperCase());
}
```

*   **参考回答**：
    *   **问题**：`number` 类型没有 `toUpperCase` 方法。TS 编译器会报错，因为联合类型只能访问所有成员**共有的属性**。
    *   **修复**：使用类型收窄。
        ```typescript
        function printId(id: number | string) {
          if (typeof id === "string") {
            console.log("Your ID is: " + id.toUpperCase());
          } else {
            console.log("Your ID is: " + id);
          }
        }
        ```

---
