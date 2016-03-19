const cheerio = require("cheerio"),
  config = require("../config"),
  util = require("../util");

const BASE_URL = "https://eztv.ag/",
  SHOWLIST = "showlist/",
  SHOWS = "shows/";
let request = require("request");
request = request.defaults({
  "baseUrl": BASE_URL,
  "timeout": config.webRequestTimeout * 1000
});

/* Get all the shows from eztv. */
const getAllShows = (retry = true) => {
  return new Promise((resolve, reject) => {
    request(SHOWLIST, (err, res, body) => {
      if (err && retry) {
        resolve(getAllShows(false));
      } else if (err) {
        reject(err + " with link: '" + SHOWLIST + "'");
      } else if (!body || res.statusCode >= 400) {
        reject("EZTV: Could not load link: '" + SHOWLIST + "'");
      } else {
        const $ = cheerio.load(body);

        const allShows = [];
        $(".thread_link").each(function() {
          const show = $(this).text();
          const id = $(this).attr("href").match(/\/shows\/(.*)\/(.*)\//)[1];
          let slug = $(this).attr("href").match(/\/shows\/(.*)\/(.*)\//)[2];
          slug = slug in config.eztvMap ? config.eztvMap[slug] : slug;
          allShows.push({
            show: show,
            id: id,
            slug: slug
          });
        });
        resolve(allShows);
      }
    });
  });
};

/* Get all the episodes from a given eztv show. */
const getShowData = (data, retry = true) => {
  return new Promise((resolve, reject) => {
    request(SHOWS + data.id + "/" + data.slug + "/", (err, res, body) => {
      if (err && retry) {
        resolve(getShowData(data, false));
      } else if (err) {
        reject(err + " with link: '" + SHOWS + data.id + "/" + data.slug + "/'");
      } else if (!body || res.statusCode >= 400) {
        reject("EZTV: Could not find episodes for: '" + data.slug + "'");
      } else {
        const $ = cheerio.load(body);

        let imdb = $("div[itemtype='http://schema.org/AggregateRating']").find("a[target='_blank']").attr("href");
        if (imdb) {
          imdb = imdb.match(/\/title\/(.*)\//)[1];
          imdb = imdb in config.imdbMap ? config.imdbMap[imdb] : imdb;
          data.slug = imdb;
        }

        data.episodes = {};
        $("tr.forum_header_border[name='hover']").each(function() {
          const title = $(this).children("td").eq(1).text().replace("x264", "");
          const link = $(this).children("td").eq(2).children("a");

          const magnet = $(this).children("td").eq(2).children("a.magnet").first().attr("href");
          if (magnet === null) return true;

          const seasonBased = /S?0*(\d+)?[xE]0*(\d+)/;
          const dateBased = /(\d{4}).(\d{2}.\d{2})/;
          const vtv = /(\d{1,2})[x](\d{2})/;
          const quality = title.match(/(\d{3,4})p/) ? title.match(/(\d{3,4})p/)[0] : "480p";

          let season, episode;
          const torrent = {
            url: magnet,
            seeds: 0,
            peers: 0,
            provider: "EZTV"
          };

          if (title.match(seasonBased) || title.match(vtv)) {
            season = parseInt(title.match(seasonBased)[1], 10);
            episode = parseInt(title.match(seasonBased)[2], 10);
            data.episodes.dateBased = false;
          } else if (title.match(dateBased)) {
            season = title.match(dateBased)[1];
            episode = title.match(dateBased)[2].replace(/\s/g, "-");
            data.episodes.dateBased = true;
          }

          if (season && episode) {
            if (!data.episodes[season]) data.episodes[season] = {};
            if (!data.episodes[season][episode]) data.episodes[season][episode] = {};
            if (!data.episodes[season][episode][quality] || title.toLowerCase().indexOf("repack") > -1)
              data.episodes[season][episode][quality] = torrent;
          }
        });
        resolve(data);
      }
    });
  });
};

module.exports = {

  getAllShows: getAllShows,
  getShowData: getShowData

};
