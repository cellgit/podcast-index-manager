import { Queue } from 'bullmq';

const queue = new Queue('test');
console.log('queue name:', queue.name);
await queue.disconnect();
