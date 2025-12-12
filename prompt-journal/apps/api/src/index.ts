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