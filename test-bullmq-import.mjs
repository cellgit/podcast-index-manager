import { Queue } from 'bullmq';

const queue = new Queue('test', {
  connection: {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env.REDIS_PORT ?? 6379),
  },
});

console.log('queue name:', queue.name);
await queue.disconnect();
