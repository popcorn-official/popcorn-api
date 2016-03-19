const cheerio = require("cheerio"),
  config = require("../config"),
  util = require("../util");

const BASE_URLS = ["https://kat.cr/usearch/", "https://kickassto.co/usearch/"];
let request = require("request");
request = request.defaults({
  "headers": {
    "Accept-Encoding": "gzip, deflate"
  },
  "gzip": true,
  "timeout": config.webRequestTimeout * 1000
});

const platformMap = {
  "android": 4,
  "blackberry": 7,
  "gamecube": 15,
  "ipad": 18,
  "iphone": 19,
  "ipod": 20,
  "java": 22,
  "linux": 24,
  "mac": 25,
  "nintendo3-ds": 31,
  "nintendo-ds": 33,
  "dvd": 35,
  "other": 65,
  "palm-os": 37,
  "pc": 38,
  "ps2": 43,
  "ps3": 44,
  "ps4": 66,
  "psp": 45,
  "symbian": 52,
  "wii": 56,
  "wiiu": 68,
  "windows-ce": 57,
  "windows-mobile": 58,
  "windows-phone": 59,
  "xbox": 61,
  "xbox-360": 62,
  "xbox-one": 67
};

const languageMap = {
  "en": 2,
  "sq": 42,
  "ar": 7,
  "eu": 44,
  "bn": 46,
  "pt-br": 39,
  "bg": 37,
  "yue": 45,
  "ca": 47,
  "zh": 10,
  "hr": 34,
  "cs": 32,
  "da": 26,
  "nl": 8,
  "tl": 11,
  "fi": 31,
  "fr": 5,
  "de": 4,
  "el": 30,
  "he": 25,
  "hi": 6,
  "hu": 27,
  "it": 3,
  "ja": 15,
  "kn": 49,
  "ko": 16,
  "lt": 43,
  "ml": 21,
  "cmn": 23,
  "ne": 48,
  "no": 19,
  "fa": 33,
  "pl": 9,
  "pt": 17,
  "pa": 35,
  "ro": 18,
  "ru": 12,
  "sr": 28,
  "sl": 36,
  "es": 14,
  "sv": 20,
  "ta": 13,
  "te": 22,
  "th": 24,
  "tr": 29,
  "uk": 40,
  "vi": 38
};

/* Formats the info from a given search page. */
const formatPage = (response, page, date) => {
  const $ = cheerio.load(response);

  const matcher = /\s+[a-zA-Z]+\s\d+[-]\d+\s[a-zA-Z]+\s(\d+)/;
  const totalResults = $("table#mainSearchTable.doublecelltable").find("h2").find("span").text().match(matcher);
  const totalPages = $("div.pages.botmarg5px.floatright").children("a.turnoverButton.siteButton.bigButton").last().text();

  const formatted = {
    response_time: parseInt(date),
    page: parseInt(page),
    totalResults: parseInt(totalResults[1]),
    totalPages: totalPages ? totalPages : 1,
    results: []
  };

  $("table.data").find("tr[id]").each(function() {
    const torrent = {
      title: $(this).find("a.cellMainLink").text(),
      category: $(this).find("span.font11px.lightgrey.block").find("a[href]").last().text(),
      link: $(this).find("a.cellMainLink[href]").attr("href"),
      guid: $(this).find("a.cellMainLink[href]").attr("href"),
      verified: $(this).find("i.ka.ka16.ka-verify.ka-green").length,
      comments: parseInt($(this).find("a.icommentjs.kaButton.smallButton.rightButton").text()),
      magnet: $(this).find("a.icon16[data-nop]").attr("href"),
      torrentLink: $(this).find("a.icon16[data-download]").attr("href"),
      size: parseInt($(this).find("td.center").eq(0).text()),
      files: parseInt($(this).find("td.center").eq(1).text()),
      pubDate: Number(new Date($(this).find("td.center").eq(2).attr("title"))),
      seeds: parseInt($(this).find("td.center").eq(3).text()),
      leechs: parseInt($(this).find("td.center").eq(4).text())
    };
    torrent.peers = torrent.seeds + torrent.leechs;
    formatted.results.push(torrent);
  });

  return formatted;
};

/* Request the data from kat.cr with an endpoint. */
const requestData = (url, endpoint, retry = true) => {
  return new Promise((resolve, reject) => {
    request(url + endpoint, (err, res, body) => {
      if (err && retry) {
        resolve(requestData(BASE_URLS[1], endpoint, false));
      } else if (err) {
        reject(err + " with link: '" + endpoint + "'");
      } else if (!body || res.statusCode >= 400) {
        reject("KAT: Could not load data from: '" + endpoint + "'");
      } else {
        resolve(body);
      }
    });
  });
};

/* Makes an endpoint for the request. */
const makeEndpoint = (query) => {
  let endpoint = "";

  if (!query) {
    util.onError("Field 'query' is required.");
  } else if (typeof(query) === "string") {
    endpoint += query;
  } else if (typeof(query) === "object") {
    if (query.query) endpoint += query.query;
    if (query.category) endpoint += " category:" + query.category;
    if (query.uploader) endpoint += " user:" + query.uploader;
    if (query.min_seeds) endpoint += " seeds:" + query.min_seeds;
    if (query.age) endpoint += " age:" + query.age;
    if (query.min_files) endpoint += " files:" + query.min_files;
    if (query.imdb) endpoint += " imdb:" + query.imdb.replace(/\D/g, "");
    if (query.tvrage) endpoint += " tv:" + query.tvrage;
    if (query.isbn) endpoint += " isbn:" + query.isbn;
    if (query.language) {
      const languageCode = languageMap[query.language] != undefined ? languageMap[query.language] : "";
      endpoint += " lang_id:" + languageCode;
    }
    if (query.adult_filter) endpoint += " is_safe:" + query.adult_filter;
    if (query.verified) endpoint += " verified:" + query.verified;
    if (query.season) endpoint += " season:" + query.season;
    if (query.episode) endpoint += " episode:" + query.episode;
    if (query.platform_id) {
      const platformCode = platformMap[query.platform_id] != undefined ? platformMap[query.platform_id] : "";
      endpoint += " platform_id:" + platformCode;
    }
    if (query.page) endpoint += "/" + query.page;
    if (query.sort_by) endpoint += "/?field=" + query.sort_by;
    if (query.order) endpoint += "&order=" + query.order;
  } else {
    util.onError("No valid query.");
  }

  return endpoint;
};

module.exports = {

  /* Returns the formated data from a search request. */
  search: (query) => {
    const endpoint = makeEndpoint(query);
    const t = Date.now();
    return requestData(BASE_URLS[0], endpoint).then((response) => {
      return formatPage(response, query.page || 1, Date.now() - t);
    });
  }

};
