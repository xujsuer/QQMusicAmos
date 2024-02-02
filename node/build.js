// 导入fs模块和path模块
const fs = require('fs');
const path = require('path');

// 初始化routes变量
let routes = `module.exports = {
`;

// 创建一个名为blackSet的Set集合，包含[data, index]两个元素
const blackSet = new Set(['data', 'index']);

// 读取指定路径的文件列表
fs.readdirSync(path.join(__dirname, '../routes')).forEach(file => {
  // 获取文件名，去掉后缀名
  const filename = file.replace(/\.js$/, '');
  
  // 如果文件名不在blackSet集合中
  if (!blackSet.has(filename)) {
    // 将文件名和require函数调用拼接到routes变量中
    routes += `  ${filename}: require('../routes/${filename}'),
`;
  }
})
// 将最后一个require语句的结尾符加上
routes += `}
`;

// 将生成的routes变量写入文件
fs.writeFileSync(path.join(__dirname, 'routes.js'), routes);