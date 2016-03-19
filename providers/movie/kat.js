const async = require("async-q"),
  config = require("../../config"),
  kat = require("../../lib/kat"),
  util = require("../../util");
let helper, name;


/* Get all the movies competable with Popcorn Time. */
const getMovie = function*(katMovie) {
  const newMovie = yield util.spawn(helper.getTraktInfo(katMovie.slug));
  if (typeof(newMovie) != "undefined" && newMovie._id) {
    delete katMovie.movieTitle;
    delete katMovie.slug;
    delete katMovie.torrentLink;
    delete katMovie.quality;

    return yield helper.addTorrents(newMovie, katMovie);
  }
};

/* Extract movie information based on a regex. */
const extractMovie = (torrent, regex) => {
  const movieTitle = torrent.title.match(regex)[1].replace(/\./g, " ");
  let slug = movieTitle.replace(/\s+/g, "-").toLowerCase();
  slug = slug in config.katMap ? config.katMap[slug] : slug;
  const quality = torrent.title.match(/(\d{3,4})p/) != null ? torrent.title.match(/(\d{3,4})p/)[0] : "480p";

  const movie = {
    movieTitle: movieTitle,
    slug: slug,
    torrentLink: torrent.link,
    quality: quality
  };

  movie[quality] = {
    url: torrent.magnet,
    seeds: torrent.seeds,
    peers: torrent.peers,
    provider: name
  };

  return movie;
};

/* Get mocie info from a given torrent. */
const getMovieData = (torrent) => {
  const regex = /(.*).(\d{3,4})p/;
  if (torrent.title.match(regex)) {
    return extractMovie(torrent, regex);
  }
};

/* Puts all the found movies from the torrents in an array. */
const getAllKATMovies = (torrents) => {
  const movies = [];
  return async.mapSeries(torrents, (torrent) => {
    if (torrent) {
      const movie = getMovieData(torrent);
      if (movie) {
        if (movies.length != 0) {
          const matching = movies.filter((m) => {
            return m.movieTitle === movie.movieTitle && m.slug === movie.slug;
          });

          if (matching.length != 0) {
            const index = movies.indexOf(matching[0]);
            if (!matching[0][movie.quality]) {
              matching[0][movie.quality] = movie[movie.quality];
            }

            movies.splice(index, 1, matching[0]);
          } else {
            movies.push(movie);
          }
        } else {
          movies.push(movie);
        }
      }
    }
  }).then((value) => {
    return movies;
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
      provider.query.category = "movies";
      provider.query.verified = 1;
      provider.query.adult_filter = 1;

      const getTotalPages = yield kat.search(provider.query);
      let totalPages = getTotalPages.totalPages; // Change to 'const' for production.
      totalPages = 3; // For testing purposes only.
      console.log(name + ": Total pages " + totalPages);

      const katTorrents = yield getAllTorrents(totalPages, provider);
      const katMovies = yield getAllKATMovies(katTorrents);
      return yield async.mapLimit(katMovies, config.maxWebRequest, (katMovie) => {
        return util.spawn(getMovie(katMovie)).catch((err) => {
          util.onError(err);
          return err;
        });
      });
    }

  };

};

module.exports = KAT;
