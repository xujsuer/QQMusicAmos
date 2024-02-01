module.exports = {
  // 搜索功能
  "/": async ({ req, res, request, cache }) => {
    const {
      pageNo = 1,
      pageSize = 20,
      key,
      t = 0, // t 参数的搜索类型：0-单曲，1-歌手，2-专辑，3-歌单，4-MV，7-歌词，8-用户
      raw,
    } = req.query;
    const cacheKey = `search_${key}_${pageNo}_${pageSize}_${t}`;
    const cacheData = cache.get(cacheKey);
    if (cacheData) {
      res.send(cacheData);
      return;
    }

    if (!key) {
      return res.status(500).send({ result: 500, errMsg: "关键词不能为空" });
    }

    const url = "https://u.y.qq.com/cgi-bin/musicu.fcg";
    const data = {
      "music.search.SearchCgiService": {
        method: "DoSearchForQQMusicDesktop",
        module: "music.search.SearchCgiService",
        param: {
          num_per_page: pageSize,
          page_num: pageNo,
          query: key,
          search_type: t,
        },
      },
    };

    try {
      const result = await request({
        url,
        method: "post",
        data,
        headers: { Referer: "https://y.qq.com" },
      });

      if (raw) {
        return res.send(result);
      }

      const { keyword, sum, perpage, curpage } = result["music.search.SearchCgiService"].data.meta;
      const searchResult = result["music.search.SearchCgiService"].data.body.song.list || [];
      const list = searchResult.map(item => ({
        singer: item.singer,
        name: item.title,
        songid: item.id,
        songmid: item.mid,
        songname: item.title,
        albumid: item.album.id,
        albummid: item.album.mid,
        albumname: item.album.name,
        interval: item.interval,
        strMediaMid: item.file.media_mid,
        size128: item.file.size_128mp3,
        size320: item.file.size_320mp3,
        sizeape: item.file.size_ape,
        sizeflac: item.file.size_flac,
      }));

      const pageNo = curpage;
      const pageSize = perpage;
      const total = sum;

      const resData = {
        result: 100,
        data: {
          list,
          pageNo,
          pageSize,
          total,
          key: keyword || key,
          t,
        },
      };
      cache.set(cacheKey, resData, 120);
      res.send(resData);
    } catch (error) {
      res.status(500).send({ result: 500, errMsg: "系统异常" });
    }
  },

  // 获取热搜词
  '/hot': async ({ req, res, request }) => {
    const { raw } = req.query;
    const result = await request({
      url: 'https://c.y.qq.com/splcloud/fcgi-bin/gethotkey.fcg',
    });

    if (raw) {
      return res.send(result);
    }
    res.send({ result: 100, data: result.data.hotkey });
  },

  // 快速搜索
  '/quick': async ({ req, res, request }) => {
    const { raw, key } = req.query;
    if (!key) {
      return res.status(500).send({ result: 500, errMsg: "关键词不能为空" });
    }
    const result = await request(
      `https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg?key=${encodeURIComponent(key)}&g_tk=5381`,
    );

    if (raw) {
      return res.send(result);
    }
    res.send({ result: 100, data: result.data });
  },
};