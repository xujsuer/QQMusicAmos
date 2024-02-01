# QQMusicAmos

[![NPM](https://img.shields.io/npm/v/qq-music-amos.svg)](https://www.npmjs.com/package/qq-music-api)
[![github](https://img.shields.io/badge/github-QQMusicAmos-brightgreen.svg)](https://github.com/jsososo/QQMusicAmos)
[![GitHub Pages Star](https://img.shields.io/github/stars/jsososo/QQMusicAmos.svg)](https://github.com/jsososo/QQMusicAmos)


接口参考：

## 快速上手

### Node 服务

```shell script
git clone git@github.com:xujuser/QQMusicAmos.git

yarn

yarn start
```

### Docker

```shell script
yarn build:docker

yarn start:docker
```


### npm

```shell script
yarn add qq-music-amos
```

#### 接口调用

```javascript
const qqMusic = require('qq-music-amos');

// 部分接口依赖 cookie, 这里穿参可以使用字符串或对象
qqMusic.setCookie('xxx=xxx; xxx=xxx;');
// or
qqMusic.setCookie({ a: 'xxx', b: 'xxx' });

qqMusic.api('search', { key: '周杰伦' })
    .then(res => console.log(res))
    .catch(err => console.log('接口调用出错'))

qqMusic.api('search', { key: '周杰伦' })
    .then((res) => console.log('搜索周杰伦：', res))
    .catch(err => console.log('接口调用出错'))

qqMusic.api('search/hot')
    .then((res) => console.log('热搜词：', res))
    .catch(err => console.log('接口调用出错'))//

// 刷新登陆
qqMusic.api('user/refresh')
```

#### 获取当前cookie

```javascript
const qqMusic = require('qq-music-amos');

console.log(qqMusic.cookie);
```

#### 获取当前 cookie 用户
```javascript
const qqMusic = require('qq-music-amos');

console.log(qqMusic.uin);
```


