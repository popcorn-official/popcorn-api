const async = require("async-q"),
  Show = require("../../models/Show"),
  trakt = require("../../lib/trakt"),
  util = require("../../util");
let name;

/* Update a given show (doc) with it's associated episodes. */
const updateEpisodes = function*(doc) {
  const found = yield Show.findOne({
    _id: doc._id
  }).exec();
  if (found) {
    console.log(name + ": '" + found.title + "' is an existing show.");
    for (let i = 0; i < found.episodes.length; i++) {
      let matching = doc.episodes.filter((docEpisode) => {
        return docEpisode.season === found.episodes[i].season && docEpisode.episode === found.episodes[i].episode;
      });

      if (matching.length != 0) {
        let index = doc.episodes.indexOf(matching[0]);
        if ((!matching[0].torrents["480p"] && found.episodes[i].torrents["480p"]) || (matching[0].torrents["480p"] && found.episodes[i].torrents["480p"] && matching[0].torrents["480p"].seeds < found.episodes[i].torrents["480p"].seeds) || (matching[0].torrents["480p"] && found.episodes[i].torrents["480p"] && matching[0].torrents["480p"].magnet === found.episodes[i].torrents["480p"].magnet)) {
          matching[0].torrents["0"] = found.episodes[i].torrents["480p"];
          matching[0].torrents["480p"] = found.episodes[i].torrents["480p"];
        }
        if ((!matching[0].torrents["720p"] && found.episodes[i].torrents["720p"]) || (matching[0].torrents["720p"] && found.episodes[i].torrents["720p"] && matching[0].torrents["720p"].seeds < found.episodes[i].torrents["720p"].seeds) || (matching[0].torrents["720p"] && found.episodes[i].torrents["720p"] && matching[0].torrents["720p"].magnet === found.episodes[i].torrents["720p"].magnet)) {
          matching[0].torrents["720p"] = found.episodes[i].torrents["720p"];
        }
        if ((!matching[0].torrents["1080p"] && found.episodes[i].torrents["1080p"]) || (matching[0].torrents["1080p"] && found.episodes[i].torrents["1080p"] && matching[0].torrents["1080p"].seeds < found.episodes[i].torrents["1080p"].seeds) || (matching[0].torrents["1080p"] && found.episodes[i].torrents["1080p"] && matching[0].torrents["1080p"].magnet === found.episodes[i].torrents["1080p"].magnet)) {
          matching[0].torrents["1080p"] = found.episodes[i].torrents["1080p"];
        }

        doc.episodes.splice(index, 1, matching[0]);
      } else {
        doc.episodes.push(found.episodes[i]);
      }
    }

    const saved = yield Show.findOneAndUpdate({
      _id: doc._id
    }, doc).exec();
    const distinct = yield Show.distinct("episodes.season", {
      _id: saved._id
    }).exec();
    saved.num_seasons = distinct.length;
    return saved.save();
  } else {
    console.log(name + ": '" + doc.title + "' is a new show!");
    return new Show(doc).save();
  }
};

/* Adds one season to a show. */
const addSeason = function*(doc, episodes, seasonNumber, slug) {
  seasonNumber = parseInt(seasonNumber);
  if (!isNaN(seasonNumber)) {
    const season = yield trakt.getSeason(slug, seasonNumber)
    for (let episodeData in season) {
      episodeData = season[episodeData];
      if (typeof(episodes[seasonNumber]) !== "undefined" && typeof(episodes[seasonNumber][episodeData.number]) !== "undefined") {
        const episode = {
          tvdb_id: episodeData.ids["tvdb"],
          season: episodeData.season,
          episode: episodeData.number,
          title: episodeData.title,
          overview: episodeData.overview,
          date_based: false,
          first_aired: new Date(episodeData.first_aired).getTime() / 1000.0,
          watched: {
            watched: false
          },
          torrents: []
        };

        episode.torrents = episodes[seasonNumber][episodeData.number];
        episode.torrents[0] = episodes[seasonNumber][episodeData.number]["480p"] ? episodes[seasonNumber][episodeData.number]["480p"] : episodes[seasonNumber][episodeData.number]["720p"]; // Prevents breaking the app
        doc.episodes.push(episode);
      }
    }
  }
};

const Helper = (_name) => {

  name = _name;

  return {

    /* Adds episodes to a document. */
    addEpisodes: (show, episodes, slug) => {
      return async.each(Object.keys(episodes), (seasonNumber) => {
        return util.spawn(addSeason(show, episodes, seasonNumber, slug));
      }).then((value) => {
        return util.spawn(updateEpisodes(show));
      });
    },

    /* Get info from Trakt and make a new show object. */
    getTraktInfo: function*(slug) {
      const traktShow = yield trakt.getShow(slug);
      const traktWatchers = yield trakt.getShowWatching(slug);
      if (traktShow.ids["imdb"]) {
        return {
          _id: traktShow.ids["imdb"],
          imdb_id: traktShow.ids["imdb"],
          tvdb_id: traktShow.ids["tvdb"],
          title: traktShow.title,
          year: traktShow.year,
          slug: slug,
          synopsis: traktShow.overview,
          runtime: traktShow.runtime,
          rating: {
            hated: 100,
            loved: 100,
            votes: traktShow.votes,
            watching: traktWatchers.length,
            percentage: Math.round(traktShow.rating * 10)
          },
          country: traktShow.country,
          network: traktShow.network,
          air_day: traktShow.airs.day,
          air_time: traktShow.airs.time,
          status: traktShow.status,
          num_seasons: 0,
          last_updated: Number(new Date()),
          images: {
            fanart: traktShow.images.fanart.full != null ? traktShow.images.fanart.full : "images/posterholder.png",
            poster: traktShow.images.poster.full != null ? traktShow.images.poster.full : "images/posterholder.png",
            banner: traktShow.images.banner.full != null ? traktShow.images.banner.full : "images/posterholder.png"
          },
          genres: traktShow.genres.length != 0 ? traktShow.genres : ["Unknown"],
          episodes: []
        }
      }
    }

  };

};

module.exports = Helper;
