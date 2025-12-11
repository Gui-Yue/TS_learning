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