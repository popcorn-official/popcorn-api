const async = require("async-q"),
  config = require("../../config"),
  kat = require("../../lib/kat"),
  util = require("../../util");
let helper, name;

/* Get all the shows competable with Popcorn Time. */
const getShow = function*(katShow) {
  const newShow = yield util.spawn(helper.getTraktInfo(katShow.slug));
  if (typeof(newShow) != "undefined" && newShow._id) {
    const slug = katShow.slug;

    delete katShow.showTitle;
    delete katShow.slug;
    delete katShow.torrentLink;
    delete katShow.season;
    delete katShow.episode;
    delete katShow.quality;
    delete katShow.dateBased;
    delete katShow[0];
    newShow.num_seasons = Object.keys(katShow).length;
    return yield helper.addEpisodes(newShow, katShow, slug);
  }
};

/* Extract show information based on a regex. */
const extractShow = (torrent, regex, dateBased) => {
  const showTitle = torrent.title.match(regex)[1].replace(/\./g, " ");
  let slug = showTitle.replace(/\s+/g, "-").toLowerCase();
  slug = slug in config.katMap ? config.katMap[slug] : slug;
  let season = torrent.title.match(regex)[2];
  let episode = torrent.title.match(regex)[3];
  if (!dateBased) {
    season = parseInt(season, 10);
    episode = parseInt(episode, 10);
  }
  const quality = torrent.title.match(/(\d{3,4})p/) != null ? torrent.title.match(/(\d{3,4})p/)[0] : "480p";

  const episodeTorrent = {
    url: torrent.magnet,
    seeds: torrent.seeds,
    peers: torrent.peers,
    provider: name
  };

  const show = {
    showTitle: showTitle,
    slug: slug,
    torrentLink: torrent.link,
    season: season,
    episode: episode,
    quality: quality,
    dateBased: dateBased
  };

  if (!show[season]) show[season] = {};
  if (!show[season][episode]) show[season][episode] = {};
  if ((!show[season][episode][quality] || show.showTitle.toLowerCase().indexOf("repack") > -1) || (show[season][episode][quality] && show[season][episode][quality].seeds < episodeTorrent.seeds))
    show[season][episode][quality] = episodeTorrent;

  return show;
};

/* Get show info from a given torrent. */
const getShowData = (torrent) => {
  const seasonBased = /(.*).[sS](\d{2})[eE](\d{2})/;
  const vtv = /(.*).(\d{1,2})[x](\d{2})/;
  const dateBased = /(.*).(\d{4}).(\d{2}.\d{2})/;
  if (torrent.title.match(seasonBased)) {
    return extractShow(torrent, seasonBased, false);
  } else if (torrent.title.match(vtv)) {
    return extractShow(torrent, vtv, false);
  } else if (torrent.title.match(dateBased)) {
    return extractShow(torrent, dateBased, true);
  } else {
    util.onError(name + ": Could not find data from torrent: '" + torrent.title + "'");
  }
};

/* Puts all the found shows from the torrents in an array. */
const getAllKATShows = (torrents) => {
  const shows = [];
  return async.mapSeries(torrents, (torrent) => {
    if (torrent) {
      const show = getShowData(torrent);
      if (show) {
        if (shows.length != 0) {
          const matching = shows.filter((s) => {
            return s.showTitle === show.showTitle && s.slug === show.slug;
          });

          if (matching.length != 0) {
            const index = shows.indexOf(matching[0]);
            if (!matching[0][show.season]) matching[0][show.season] = {};
            if (!matching[0][show.season][show.episode]) matching[0][show.season][show.episode] = {};
            if ((!matching[0][show.season][show.episode][show.quality] || matching[0].showTitle.toLowerCase().indexOf("repack") > -1) || (matching[0][show.season][show.episode][show.quality] && matching[0][show.season][show.episode][show.quality].seeds < show[show.season][show.episode][show.quality].seeds))
              matching[0][show.season][show.episode][show.quality] = show[show.season][show.episode][show.quality];

            shows.splice(index, 1, matching[0]);
          } else {
            shows.push(show);
          }
        } else {
          shows.push(show);
        }
      }
    }
  }).then((value) => {
    return shows;
  });
};

/* Get all the torrents of a given provider. */
const getAllTorrents = (totalPages, provider) => {
  let katTorrents = [];
  return async.timesSeries(totalPages, (page) => {
    provider.query.page = page + 1;
    console.log(name + ": Starting searching kat on page " + provider.query.page + " needs more " + (provider.query.page < totalPages));
    return kat.search(provider.query).then((result) => {
      katTorrents = katTorrents.concat(result.results);
    }).catch((err) => {
      util.onError(err);
      return err;
    });
  }).then((value) => {
    console.log(name + ": Found " + katTorrents.length + " torrents.");
    return katTorrents;
  });
};


const KAT = (_name) => {

  name = _name;
  helper = require("./helper")(name);

  return {

    /* Returns a list of all the inserted torrents. */
    search: function*(provider) {
      console.log(name + ": Starting scraping...");
      provider.query.page = 1;
      provider.query.category = "tv";
      provider.query.verified = 1;
      provider.query.adult_filter = 1;

      const getTotalPages = yield kat.search(provider.query);
      const totalPages = getTotalPages.totalPages; // Change to 'const' for production.
      //totalPages = 3; // For testing purposes only.
      console.log(name + ": Total pages " + totalPages);

      const katTorrents = yield getAllTorrents(totalPages, provider);
      const katShows = yield getAllKATShows(katTorrents);
      return yield async.mapLimit(katShows, config.maxWebRequest, (katShow) => {
        return util.spawn(getShow(katShow)).catch((err) => {
          util.onError(err);
          return err;
        });
      });
    }

  };

};

module.exports = KAT;
