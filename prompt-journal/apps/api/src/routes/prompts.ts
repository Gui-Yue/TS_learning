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