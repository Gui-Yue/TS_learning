import Fastify from 'fastify';

// 1. 初始化实例
const server = Fastify({
  logger: true // 开启内置日志，不用自己 print 了
});

// 2. 定义路由
server.get('/ping', async (request, reply) => {
  // 直接返回对象，Fastify 会自动序列化成 JSON
  return { 
    message: 'pong', 
    timestamp: new Date() 
  };
});

// 3. 启动服务
const start = async () => {
  try {
    // 监听 3001 端口
    // host: '0.0.0.0' 是为了让外部（如 Docker 或局域网）也能访问
    await server.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server is running at http://localhost:3001');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();