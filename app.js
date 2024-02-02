// 引入所需模块
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fs = require('fs');
const DataStatistics = require('./util/dataStatistics');
const jsonFile = require('jsonfile');
const Feedback = require('./util/feedback');
const Cache = require('./util/cache');
const config = require('./bin/config');
const Request = require('./util/request');
const GlobalCookie = require('./util/globalCookie');

// 创建Express应用实例
const app = express();

// 初始化工具类实例
const dataHandle = new DataStatistics();
const feedback = new Feedback();
const cache = new Cache();
const globalCookie = GlobalCookie();

// 每10分钟保存一次数据（如果配置开启）
if (config.useDataStatistics) {
  setInterval(() => dataHandle.saveInfo(), 60000 * 10);
}

// 设置视图引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// 使用中间件
app.use(logger('dev')); // 日志记录中间件
app.use(express.json()); // JSON解析中间件
app.use(express.urlencoded({ extended: false })); // URL编码解析中间件
app.use(cookieParser()); // Cookie解析中间件
app.use(express.static(path.join(__dirname, 'public'))); // 静态资源服务中间件

// 如果配置开启，使用请求统计中间件
if (config.useDataStatistics) {
  app.use((req, res, next) => dataHandle.record(req, res, next));
}

// 跨域配置
const corsMap = {
  '/user/setCookie': true,
};

// 加载并注册路由
fs.readdirSync(path.join(__dirname, 'routes')).forEach(file => {
  const filename = file.replace(/\.js$/, '');
  const RouterMap = require(`./routes/${filename}`);

  Object.keys(RouterMap).forEach((path) => {
    app.use(`/${filename}${path}`, (req, res, next) => {
      // 创建内部Router实例
      const router = express.Router();

      // 创建Request封装实例
      const request = Request(req, res, { globalCookie });

      // 合并查询参数与请求体
      req.query = {
        ...req.query,
        ...req.body,
        ownCookie: 1,
      };

      // 处理qq和微信登录的uin信息
      let uin = req.cookies.uin || '';
      if (Number(req.cookies.login_type) === 2) {
        uin = req.cookies.wxuin;
      }
      req.cookies.uin = uin.replace(/\D/g, '');

      // 获取对应路由处理函数
      const func = RouterMap[path];

      // 准备传递给路由处理函数的参数对象
      const args = { request, dataStatistics: dataHandle, feedback, cache, globalCookie };

      // 注册路由处理器（支持POST和GET方法）
      router.post('/', (req, res) => func({ req, res, ...args }));
      router.get('/', (req, res) => func({ req, res, ...args }));

      // 如需跨域，则设置CORS响应头
      if (corsMap[`/${filename}${path}`]) {
        router.options('/', (req, res) => {
          res.set('Access-Control-Allow-Origin', 'https://y.qq.com');
          res.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
          res.set('Access-Control-Allow-Headers', 'Content-Type');
          res.set('Access-Control-Allow-Credentials', 'true');
          res.sendStatus(200);
        });
      }

      // 执行内部Router
      router(req, res, next);
    });
  });
});

// 注册根路由
app.use('/', (req, res, next) => {
  const router = express.Router();
  router.get('/', (req, res) => require('./routes/index')['/'](req, res));
  router(req, res, next);
});

// 404错误处理中间件
app.use(function (req, res, next) {
  next(createError(404));
});

// 错误处理中间件
app.use(function (err, req, res, next) {
  // 设置本地变量供模板使用
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // 渲染错误页面
  res.status(err.status || 500);
  res.render('error');
});

// 导出Express应用实例
module.exports = app;