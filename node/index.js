// 导入需要的模块
const routes = require('./routes');
const Cache = require('../util/cache');
const Request = require('../util/request');

// 创建缓存实例
const cache = new Cache();

// 创建禁止访问的函数集合
const blackFunc = new Set([
  'user/cookie',
  'user/getCookie',
  'user/setCookie',
])

// 创建QQMusic类
class QQMusic {
  // 获取cookie属性
  get cookie() {
    return this._cookie || {};
  }

  // 获取uin属性
  get uin() {
    return this.cookie.uin;
  }

  // 设置cookie方法
  setCookie(cookies) {
    // 根据cookies的类型进行处理
    switch (typeof cookies) {
      case 'string': {
        // 创建cookie对象
        const cookieObj = {};
        // 将cookies字符串按分号和空格分割为数组
        cookies.split('; ').forEach((c) => {
          // 将数组中的元素按等号分割为数组
          const arr = c.split('=');
          // 将数组中的元素赋值给cookie对象
          cookieObj[arr[0]] = arr[1];
        });

        // 如果login_type为2，则将wxuin赋值给uin
        if (Number(cookieObj.login_type) === 2) {
          cookieObj.uin = cookieObj.wxuin;
        }
        // 移除uin中的非数字字符
        cookieObj.uin = (cookieObj.uin || '').replace(/\D/g, '');
        // 将处理后的cookie对象赋值给this._cookie
        this._cookie = cookieObj;
        break;
      }
      case 'object':
        // 将传入的cookies对象赋值给this._cookie
        this._cookie = cookies;
        break;
    }
  }

  // api方法
  api = (path, query = {}) => {
    return new Promise((resolve, reject) => {
      // 将path中的第一个斜杠替换为空字符串，并将剩余部分按斜杠分割为数组
      const truePath = path.replace(/^\/|\/$/g, '').split('/');
      // 获取baseFunc
      const baseFunc = truePath.shift();
      // 获取func
      const func = truePath.join('/') || '';
      // 创建req对象
      const req = {
        query: {...query, ownCookie: 1},
        cookies: this.cookie,
      };
      // 创建res对象
      const res = {
        // 发送响应的方法
        send: ({result, data, errMsg}) => {
          // 如果result为100，则解析data并返回
          if (result === 100) {
            resolve(data);
          } else {
            // 否则解析errMsg并返回错误信息
            reject({message: errMsg});
          }
        },
        // 重定向方法
        redirect: (url) => url,
        // 设置cookie方法
        cookie: (k, val) => this.setCookie({...this.cookie, [k]: val}),
      };

      // 如果routes中不存在baseFunc或者baseFunc下的func路径，或者路径在blackFunc中，则返回错误信息
      if (!routes[baseFunc] || !routes[baseFunc][`/${func}`] || blackFunc.has(`${baseFunc}/${func}`)) {
        return reject({message: 'wrong path'});
      }

      try {
        // 调用routes[baseFunc][`/${func}`]方法
        routes[baseFunc][`/${func}`]({
          req,
          res,
          request: Request(req, res),
          cache,
          globalCookie: {
            userCookie: () => this.cookie,
          }
        })
      } catch (err) {
        // 发生异常时返回错误信息
        reject(err);
      }
    })
  }
}

// 导出QQMusic类的实例
module.exports = new QQMusic();