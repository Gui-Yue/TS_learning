// src/index.ts

// --- 概念 1: Interface (接口) ---
interface BaseUser {
  id: number;
  username: string;
  email?: string; // [?] 表示可选。Go里你需要用 *string 指针来实现 "无值"
  createdAt: Date;
}

// --- 概念 2: Intersection (交叉类型 &) ---
type AdminUser = BaseUser & {
  role: 'admin';      // 字面量类型：值只能是字符串 "admin"
  adminLevel: number; // 管理员独有的字段
};

type RegularUser = BaseUser & {
  role: 'user';       // 值只能是 "user"
  vipStatus: boolean; // 普通用户独有的字段
};

// --- 概念 3: Union (联合类型 |) ---
type AppUser = AdminUser | RegularUser;

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

  // 🐹 Go视角: 这就像 switch user.(type)
  // TS 极其智能：它发现我们判断了 role 字段
  if (user.role === 'admin') {
    // ✅ 在这个 if 块里，TS 100% 确定 user 是 AdminUser
    // 所以可以安全访问 adminLevel
    console.log(`   [Admin] Level: ${user.adminLevel}`);
  } else {
    // ✅ 既然不是 admin，那剩下的可能性只能是 RegularUser
    // 所以这里自动拥有 vipStatus
    console.log(`   [User] VIP: ${user.vipStatus}`);
  }
}

// --- 运行 ---
users.forEach(u => printUserInfo(u));