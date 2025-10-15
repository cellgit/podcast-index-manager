// 测试 dotenv 如何处理特殊字符
require('dotenv').config({ path: '.env.local' });

console.log('环境变量测试:');
console.log('API_KEY:', process.env.PODCASTINDEX_API_KEY);
console.log('API_SECRET:', process.env.PODCASTINDEX_API_SECRET);
console.log('USER_AGENT:', process.env.PODCASTINDEX_USER_AGENT);

const crypto = require('crypto');

function normalizeEnvValue(source) {
  if (!source) {
    return undefined;
  }
  let normalized = source.trim();
  
  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1);
  }
  
  return normalized.length > 0 ? normalized : undefined;
}

const apiKey = normalizeEnvValue(process.env.PODCASTINDEX_API_KEY);
const apiSecret = normalizeEnvValue(process.env.PODCASTINDEX_API_SECRET);

console.log('\n处理后:');
console.log('API_KEY:', apiKey);
console.log('API_SECRET:', apiSecret);

const timestamp = '1760544744';
const concatenated = `${apiKey}${apiSecret}${timestamp}`;
const hash = crypto.createHash('sha1').update(concatenated).digest('hex');

console.log('\n哈希测试:');
console.log('Timestamp:', timestamp);
console.log('Concatenated:', concatenated);
console.log('Hash:', hash);
console.log('Expected:', '44db09bc2d2a80db9fd0cbb4acea9946ccfb90bb');
console.log('Match:', hash === '44db09bc2d2a80db9fd0cbb4acea9946ccfb90bb');
