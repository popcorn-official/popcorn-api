// Import the necessary modules.
// @flow
import pMap from 'p-map'

import AbstractHelper from './AbstractHelper'
import {
  fanart,
  omdb,
  tmdb,
  trakt
} from '../apiModules'
import type {
  AnimeMovie,
  Movie
} from '../../models'

/**
 * Class for saving movies.
 * @extends {AbstractHelper}
 * @type {MovieHelper}
 */
export default class MovieHelper extends AbstractHelper {

  /**
   * Update the torrents for an existing movie.
   * @param {!AnimeMovie|Movie} movie - The new movie.
   * @param {!AnimeMovie|Movie} found - The existing movie.
   * @param {!string} language - The language of the torrent.
   * @param {!string} quality - The quality of the torrent.
   * @returns {AnimeMovie|Movie} - A movie with merged torrents.
   */
  _updateTorrent(
    movie: AnimeMovie | Movie,
    found: AnimeMovie | Movie,
    language: string,
    quality: string
  ): AnimeMovie | Movie {
    let update = false
    let movieTorrent = movie.torrents[language]

    const foundTorrent = found.torrents[language]

    if (foundTorrent && movieTorrent) {
      const foundQuality = foundTorrent[quality]
      const movieQuality = movieTorrent[quality]

      if (foundQuality && movieQuality) {
        if (foundQuality.seeds > movieQuality.seeds ||
            foundQuality.url === movieQuality.url) {
          update = true
        }
      } else if (foundQuality && !movieQuality) {
        update = true
      }
    } else if (foundTorrent && !movieTorrent) {
      if (foundTorrent[quality]) {
        movieTorrent = {}
        update = true
      }
    }

    if (update) {
      movieTorrent[quality] = foundTorrent[quality]
    }

    return movie
  }

  /**
   * Update a given movie.
   * @param {!AnimeMovie|Movie} movie - The movie to update its torrent.
   * @returns {AnimeMovie|Movie} - A newly updated movie.
   */
  async _updateMovie(movie: AnimeMovie | Movie): AnimeMovie | Movie {
    try {
      let m = movie
      const found = await this.Model.findOne({
        imdb_id: m._id
      })

      if (found) {
        logger.info(`${this.name}: '${found.title}' is an existing movie.`)

        if (found.torrents) {
          Object.keys(found.torrents).map(language => {
            m = this._updateTorrent(m, found, language, '720p')
            m = this._updateTorrent(m, found, language, '1080p')
          })
        }

        return await this.Model.findOneAndUpdate({
          _id: m._id
        }, m, {
          upsert: true,
          new: true
        })
      }

      logger.info(`${this.name}: '${m.title}' is a new movie!`)
      return await new this.Model(m).save()
    } catch (err) {
      logger.error(err)
    }
  }

  /**
   * Adds torrents to a movie.
   * @param {!AnimeMovie|Movie} movie - The movie to add the torrents to.
   * @param {!Object} torrents - The torrents to add to the movie.
   * @returns {AnimeMovie|Movie} - A movie with torrents attached.
   */
  addTorrents(
    movie: AnimeMovie | Movie,
    torrents: Object
  ): AnimeMovie | Movie {
    return pMap(
      Object.keys(torrents),
      torrent => {
        movie.torrents[torrent] = torrents[torrent]
      }
    ).then(() => this._updateMovie(movie))
  }

  /**
   * Get movie images from TMDB.
   * @param {!string} tmdbId - The tmdb id of the movie you want the images
   * from.
   * @returns {Object} - Object with banner, fanart and poster images.
   */
   _getTmdbImages(tmdbId: number): Object {
     return tmdb.tv.images({
       tv_id: tmdbId
     }).then(i => {
       const baseUrl = 'http://image.tmdb.org/t/p/w500'

       const tmdbPoster = i.posters.filter(
         poster => poster.iso_639_1 === 'en' || poster.iso_639_1 === null
       )[0].file_path
       const tmdbBackdrop = i.backdrops.filter(
         backdrop => backdrop.iso_639_1 === 'en' || backdrop.iso_639_1 === null
       )[0].file_path

       const { Holder } = AbstractHelper
       const images = {
         banner: tmdbPoster ? `${baseUrl}${tmdbPoster}` : Holder,
         fanart: tmdbBackdrop ? `${baseUrl}${tmdbBackdrop}` : Holder,
         poster: tmdbPoster ? `${baseUrl}${tmdbPoster}` : Holder
       }

       return this.checkImages(images)
     })
   }

  /**
   * Get movie images from OMDB.
   * @param {!string} imdbId - The imdb id of the movie you want the images
   * from.
   * @returns {Object} - Object with banner, fanart and poster images.
   */
  _getOmdbImages(imdbId: string): Promise<Object | Error> {
    return omdb.byId({
      imdb: imdbId,
      type: 'movie'
    }).then(i => {
      const { Holder } = AbstractHelper
      const images = {
        banner: i.Poster ? i.Poster : Holder,
        fanart: i.Poster ? i.Poster : Holder,
        poster: i.Poster ? i.Poster : Holder
      }

      return this.checkImages(images)
    })
  }

  /**
   * Get movie images from Fanart.
   * @param {!number} tmdbId - The tvdb id of the movie you want the images
   * from.
   * @returns {Object} - Object with banner, fanart and poster images.
   */
  _getFanartImages(tmdbId: number): Promise<Object | Error> {
    return fanart.getMovieImages(tmdbId).then(i => {
      const { Holder } = AbstractHelper
      const images = {
        banner: i.moviebanner ? i.moviebanner[0].url : Holder,
        fanart: i.moviebackground
          ? i.moviebackground[0].url
          : i.hdmovieclearart
            ? i.hdmovieclearart[0].url
            : Holder,
        poster: i.movieposter ? i.movieposter[0].url : Holder
      }

      return this.checkImages(images)
    })
  }

  /**
   * Get movie images.
   * @override
   * @protected
   * @param {!number} tmdbId - The tmdb id of the movie you want the images
   * from.
   * @param {!string} imdbId - The imdb id of the movie you want the images
   * from.
   * @returns {Promise<Object>} - Object with banner, fanart and poster images.
   */
   getImages({imdbId, tmdbId}: Object): Promise<Object> {
     return this._getTmdbImages(tmdbId)
       .catch(() => AbstractHelper.DefaultImages)
   }

  /**
   * Get info from Trakt and make a new movie object.
   * @override
   * @param {!string} slug - The slug to query trakt.tv.
   * @returns {AnimeMovie|Movie} - A new movie.
   */
  async getTraktInfo(slug: string): Promise<AnimeMovie | Movie | Error> {
    try {
      const traktMovie = await trakt.movies.summary({
        id: slug,
        extended: 'full'
      })
      const traktWatchers = await trakt.movies.watching({
        id: slug
      })

      if (traktMovie && traktMovie.ids.imdb && traktMovie.ids.tmdb) {
        const { imdb, slug, tmdb } = traktMovie.ids
        const img = await trakt.images.get({
          tmdb: traktMovie.ids.imdb
          imdb: traktMovie.ids.imdb
        })
        console.log(img);

        return {
          imdb_id: imdb,
          title: traktMovie.title,
          year: traktMovie.year,
          slug,
          synopsis: traktMovie.overview,
          runtime: traktMovie.runtime,
          rating: {
            votes: traktMovie.votes,
            watching: traktWatchers ? traktWatchers.length : 0,
            percentage: Math.round(traktMovie.rating * 10)
          },
          images: {
            banner: img.fanart,
            fanart: img.background,
            poster: img.poster
          },
          genres: traktMovie.genres ? traktMovie.genres : ['unknown'],
          language: traktMovie.language,
          released: new Date(traktMovie.released).getTime() / 1000.0,
          trailer: traktMovie.trailer,
          certification: traktMovie.certification,
          torrents: {}
        }
      }
    } catch (err) {
      logger.error(`Trakt: Could not find any data on: ${err.path || err} with slug: '${slug}'`)
    }
  }

}
