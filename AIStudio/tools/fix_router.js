const fs = require('fs');
let content = fs.readFileSync('F:/AI管理平台/frontend/src/router/index.ts', 'utf8');

// 1. 修复 Vite 内部导入路径 → 标准导入
content = content.replace(
    'from "/node_modules/.vite/deps/vue-router.js?v=98c6d291"',
    "from 'vue-router'"
);

// 2. 修复所有 /src/views 绝对路径 → @/views
content = content.replace(/\/src\/views\//g, '@/views/');

fs.writeFileSync('F:/AI管理平台/frontend/src/router/index.ts', content, 'utf8');
console.log('Router fixed');

// 验证
const verify = fs.readFileSync('F:/AI管理平台/frontend/src/router/index.ts', 'utf8');
console.log('剩余 node_modules/.vite:', (verify.match(/node_modules\/\.vite/g) || []).length);
console.log('剩余 /src/views:', (verify.match(/\/src\/views/g) || []).length);
console.log('vue-router 导入:', verify.split('\n')[0]);
