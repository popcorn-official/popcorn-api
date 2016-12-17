// Import the neccesary modules.
import asyncq from "async-q";

import Movie from "../../models/Movie";
import Util from "../../Util";
import { fanart, omdb, tmdb, trakt } from "../../config/constants";

/** Class for saving movies. */
export default class Helper {

  /**
   * Create an helper object for movie content.
   * @param {String} name - The name of the content provider.
   */
  constructor(name) {
    /**
     * The name of the torrent provider.
     * @type {String}
     */
    this.name = name;

    /**
     * The util object with general functions.
     * @type {Util}
     */
    this._util = new Util();
  }

  /**
   * Update the torrents for an existing movie.
   * @param {Movie} movie - The new movie.
   * @param {Movie} found - The existing movie.
   * @param {String} language - The language of the torrent.
   * @param {String} quality - The quality of the torrent.
   * @return {Movie} - A movie with merged torrents.
   */
  _updateTorrent(movie, found, language, quality) {
    let update = false;

    if (found.torrents[language] && movie.torrents[language]) {
      if (found.torrents[language][quality] && movie.torrents[language][quality]) {
        if (found.torrents[language][quality].seed > movie.torrents[language][quality].seed) {
          update = true;
        } else if (movie.torrents[language][quality].seed > found.torrents[language][quality].seed) {
          update = false;
        } else if (found.torrents[language][quality].url === movie.torrents[language][quality].url) {
          update = true;
        }
      } else if (found.torrents[language][quality] && !movie.torrents[language][quality]) {
        update = true;
      }
    } else if (found.torrents[language] && !movie.torrents[language]) {
      if (found.torrents[language][quality]) {
        movie.torrents[language] = {};
        update = true;
      }
    }

    if (update) movie.torrents[language][quality] = found.torrents[language][quality];
    return movie;
  }

  /**
   * @description Update a given movie.
   * @function Helper#updateMovie
   * @memberof module:providers/movie/helper
   * @param {Movie} movie - The movie to update its torrent.
   * @returns {Movie} - A newly updated movie.
   */
  async _updateMovie(movie) {
    try {
      const found = await Movie.findOne({
        _id: movie._id
      }).exec();
      if (found) {
        logger.info(`${this.name}: '${found.title}' is an existing movie.`);

        if (found.torrents) {
          Object.keys(found.torrents).forEach(language => {
            movie = this._updateTorrent(movie, found, language, "720p");
            movie = this._updateTorrent(movie, found, language, "1080p");
          });
        }

        return await Movie.findOneAndUpdate({
          _id: movie._id
        }, movie).exec();
      } else {
        logger.info(`${this.name}: '${movie.title}' is a new movie!`);
        return await new Movie(movie).save();
      }
    } catch (err) {
      return this._util.onError(err);
    }
  }

  /**
   * Adds torrents to a movie.
   * @param {Movie} movie - The movie to add the torrents to.
   * @param {Object} torrents - The torrents to add to the movie.
   * @returns {Movie} - A movie with torrents attached.
   */
  addTorrents(movie, torrents) {
    return asyncq.each(Object.keys(torrents), torrent => movie.torrents[torrent] = torrents[torrent])
      .then(() => this._updateMovie(movie));
  }

  /**
   * Get movie images.
   * @param {Integer} tmdb_id - The tmdb id of the movie you want the images from.
   * @param {String} imdb_id - The imdb id of the movie you want the images from.
   * @returns {Object} - Object with a banner, fanart and poster images.
   */
  async _getImages(tmdb_id, imdb_id) {
    const holder = "images/posterholder.png";
    const images = {
      banner: holder,
      fanart: holder,
      poster: holder
    };

    try {
      const tmdbData = await tmdb.call(`/movie/${tmdb_id}/images`, {});

      let tmdbPoster = tmdbData['posters'].filter(poster => poster.iso_639_1 === "en" || poster.iso_639_1 === null)[0];
      tmdbPoster = tmdb.getImageUrl(tmdbPoster.file_path, 'w500');

      let tmdbBackdrop = tmdbData['backdrops'].filter(backdrop => backdrop.iso_639_1 === "en" || backdrop.iso_639_1 === null)[0];
      tmdbBackdrop = tmdb.getImageUrl(tmdbBackdrop.file_path, 'w500');

      images.banner = tmdbPoster ? tmdbPoster : holder;
      images.fanart = tmdbBackdrop ? tmdbBackdrop : holder;
      images.poster = tmdbPoster ? tmdbPoster : holder;

      this._util.checkImages(images, holder);
    } catch (err) {
      try {
        const omdbImages = await omdb.byID({
          imdb: imdb_id,
          type: "movie"
        });

        if (images.banner === holder) {
          images.banner = omdbImages.Poster ? omdbImages.Poster : holder;
        }
        if (images.fanart === holder) {
          images.fanart = omdbImages.Poster ? omdbImages.Poster : holder;
        }
        if (images.poster === holder) {
          images.poster = omdbImages.Poster ? omdbImages.Poster : holder;
        }

        this._util.checkImages(images, holder);
      } catch (err) {
        try {
          const fanartImages = await fanart.getMovieImages(tmdb_id);

          if (images.banner === holder) {
            images.banner = fanartImages.moviebanner ? fanartImages.moviebanner[0].url : holder;
          }
          if (images.fanart === holder) {
            images.fanart = fanartImages.moviebackground ? fanartImages.moviebackground[0].url : fanartImages.hdmovieclearart ? fanartImages.hdmovieclearart[0].url : holder;
          }
          if (images.poster === holder) {
            images.poster = fanartImages.movieposter ? fanartImages.movieposter[0].url : holder;
          }
        } catch (err) {
          this._util.onError(`Images: Could not find images on: ${err.path || err} with id: '${tmdb_id || imdb_id}'`);
        }
      }
    }

    return images;
  }

  /**
   * Get info from Trakt and make a new movie object.
   * @param {String} slug - The slug to query trakt.tv.
   * @returns {Movie} - A new movie.
   */
  async getTraktInfo(slug) {
    try {
      const traktMovie = await trakt.movies.summary({
        id: slug,
        extended: "full"
      });
      const traktWatchers = await trakt.movies.watching({ id: slug });

      let watching = 0;
      if (traktWatchers !== null) watching = traktWatchers.length;

      if (traktMovie && traktMovie.ids["imdb"] && traktMovie.ids["tmdb"]) {
        return {
          _id: traktMovie.ids["imdb"],
          imdb_id: traktMovie.ids["imdb"],
          title: traktMovie.title,
          year: traktMovie.year,
          slug: traktMovie.ids["slug"],
          synopsis: traktMovie.overview,
          runtime: traktMovie.runtime,
          rating: {
            hated: 100,
            loved: 100,
            votes: traktMovie.votes,
            watching: watching,
            percentage: Math.round(traktMovie.rating * 10)
          },
          country: traktMovie.language,
          last_updated: Number(new Date()),
          images: await this._getImages(traktMovie.ids["tmdb"], traktMovie.ids["imdb"]),
          genres: traktMovie.genres !== null ? traktMovie.genres : ["unknown"],
          released: new Date(traktMovie.released).getTime() / 1000.0,
          trailer: traktMovie.trailer || null,
          certification: traktMovie.certification,
          torrents: {}
        };
      }
    } catch (err) {
      return this._util.onError(`Trakt: Could not find any data on: ${err.path || err} with slug: '${slug}'`);
    }
  }

}
