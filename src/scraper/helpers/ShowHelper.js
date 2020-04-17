// Import the necessary modules.
// @flow
import pMap from 'p-map'

import AbstractHelper from './AbstractHelper'
import {
  fanart,
  tmdb,
  trakt,
  tvdb
} from '../apiModules'
import type {
  AnimeShow,
  Show
} from '../../models'

/**
 * Class for saving shows.
 * @extends {AbstractHelper}
 * @type {ShowHelper}
 */
export default class ShowHelper extends AbstractHelper {

  /**
   * Update the number of seasons of a given show.
   * @param {!AnimeShow|Show} show - The show to update the number of seasons.
   * @returns {AnimeShow|Show} - A newly updated show.
   */
  async _updateNumSeasons(show: AnimeShow | Show): AnimeShow | Show {
    const saved = await this.Model.findOneAndUpdate({
      _id: show.imdb_id
    }, new this.Model(show), {
      new: true,
      upsert: true
    })

    const distinct = await this.Model.distinct('episodes.season', {
      _id: saved.imdb_id
    }).exec()
    saved.num_seasons = distinct.length

    return this.Model.findOneAndUpdate({
      _id: saved.imdb_id
    }, new this.Model(saved), {
      new: true,
      upsert: true
    })
  }

  /**
   * Update the torrents for an existing show.
   * @param {!Object} matching - The matching episode of new the show.
   * @param {!Object} found - The matching episode existing show.
   * @param {!AnimeShow|Show} show - The show to merge the episodes to.
   * @param {!string} quality - The quality of the torrent.
   * @returns {AnimeShow|Show} - A show with merged torrents.
   */
  _updateEpisode(
    matching: Object,
    found: Object,
    show: AnimeShow | Show,
    quality: string
  ): AnimeShow | Show {
    const index = show.episodes.indexOf(matching)

    const foundTorrents = found.torrents[quality]
    let matchingTorrents = matching.torrents[quality]

    if (foundTorrents && matchingTorrents) {
      let update = false

      if (
        foundTorrents.seeds > matchingTorrents.seeds ||
        foundTorrents.url === matchingTorrents.url
      ) {
        update = true
      }

      if (update) {
        if (quality === '480p') {
          matching.torrents['0'] = foundTorrents
        }

        matchingTorrents = foundTorrents
      }
    } else if (foundTorrents && !matchingTorrents) {
      if (quality === '480p') {
        matching.torrents['0'] = foundTorrents
      }

      matchingTorrents = foundTorrents
    }

    show.episodes.splice(index, 1, matching)
    return show
  }

  /**
   * Update a given show with it's associated episodes.
   * @param {!AnimeShow|Show} show - The show to update its episodes.
   * @returns {AnimeShow|Show} - A newly updated show.
   */
  async _updateEpisodes(show: AnimeShow | Show): AnimeShow | Show {
    try {
      let s = show
      const found = await this.Model.findOne({
        _id: s.imdb_id
      })
      if (!found) {
        logger.info(`${this.name}: '${s.title}' is a new show!`)
        const newShow = await new this.Model(s).save()
        return await this._updateNumSeasons(newShow)
      }

      logger.info(`${this.name}: '${found.title}' is an existing show.`)

      found.episodes.map(e => {
        const matching = s.episodes.find(
          s => s.season === e.season && s.episode === e.episode
        )

        if (e.first_aired > s.latest_episode) {
          s.latest_episode = e.first_aired
        }

        if (!matching) {
          return s.episodes.push(e)
        }

        s = this._updateEpisode(matching, e, s, '480p')
        s = this._updateEpisode(matching, e, s, '720p')
        s = this._updateEpisode(matching, e, s, '1080p')
      })

      return await this._updateNumSeasons(s)
    } catch (err) {
      logger.error(err)
    }
  }

  /**
   * Adds one seasonal season to a show.
   * @param {!AnimeShow|Show} show - The show to add the torrents to.
   * @param {!Object} episodes - The episodes containing the torrents.
   * @param {!number} season - The season number.
   * @param {!string} slug - The slug of the show.
   * @returns {undefined}
   */
  _addSeasonalSeason(
    show: AnimeShow | Show,
    episodes: Object,
    season: number,
    slug: string
  ): void {
    return trakt.seasons.season({
      id: slug,
      season,
      extended: 'full'
    }).then(traktEpisodes => {
      traktEpisodes.map(e => {
        if (!episodes[season][e.number]) {
          return
        }

        const episode = {
          tvdb_id: parseInt(e.ids['tvdb'], 10),
          season: parseInt(e.season, 10),
          episode: parseInt(e.number, 10),
          title: e.title,
          overview: e.overview,
          date_based: false,
          first_aired: new Date(e.first_aired).getTime() / 1000.0,
          torrents: episodes[season][e.number]
        }

        if (episode.first_aired > show.latest_episode) {
          show.latest_episode = episode.first_aired
        }

        episode.torrents[0] = episodes[season][e.number]['480p']
          ? episodes[season][e.number]['480p']
          : episodes[season][e.number]['720p']

        show.episodes.push(episode)
      })
    }).catch(err =>
      logger.error(`Trakt: Could not find any data on: ${err.path || err} with slug: '${slug}'`)
    )
  }

  /**
   * Adds one datebased season to a show.
   * @param {!AnimeShow|Show} show - The show to add the torrents to.
   * @param {!Object} episodes - The episodes containing the torrents.
   * @param {!number} season - The season number.
   * @returns {Promise<AnimeShow|Show|undefined>} - The show with a datebased
   * season attached.
   */
  async _addDateBasedSeason(
    show: AnimeShow | Show,
    episodes: Object,
    season: number
  ): Promise<AnimeShow | Show | void> {
    try {
      if (!show.tvdb_id || !episodes[season]) {
        return
      }

      const tvdbShow = await tvdb.getSeriesAllById(show.tvdb_id)
      tvdbShow.episodes.map(tvdbEpisode => {
        Object.keys(episodes[season]).map(e => {
          const d = new Date(tvdbEpisode.firstAired)
            .toISOString()
            .substring(0, 10)
          if (`${season}-${e.replace(/\./, '-')}` !== d) {
            return
          }

          const episode = {
            tvdb_id: parseInt(tvdbEpisode.id, 10),
            season: parseInt(tvdbEpisode.airedEpisodeNumber, 10),
            episode: parseInt(tvdbEpisode.airedSeason, 10),
            title: tvdbEpisode.episodeName,
            overview: tvdbEpisode.overview,
            date_based: true,
            first_aired: new Date(tvdbEpisode.firstAired).getTime() / 1000.0,
            torrents: episodes[season][e]
          }

          if (episode.first_aired > show.latest_episode) {
            show.latest_episode = episode.first_aired
          }

          if (!episode.season) {
            return
          }

          episode.torrents[0] = episodes[season][e]['480p']
            ? episodes[season][e]['480p']
            : episodes[season][e]['720p']

          show.episodes.push(episode)
        })
      })
    } catch (err) {
      logger.error(`TVDB: Could not find any data on: ${err.path || err} with tvdb_id: '${show.tvdb_id}'`)
    }
  }

  /**
   * Adds episodes to a show.
   * @param {!AnimeShow|Show} show - The show to add the torrents to.
   * @param {!Object} episodes - The episodes containing the torrents.
   * @param {!string} slug - The slug of the show.
   * @returns {Show} - A show with updated torrents.
   */
  addEpisodes(
    show: AnimeShow | Show,
    episodes: Object,
    slug: string
  ): Show {
    let { dateBased } = episodes
    delete episodes.dateBased
    dateBased = dateBased || show.dateBased

    return pMap(Object.keys(episodes), season => {
      if (dateBased) {
        return this._addDateBasedSeason(show, episodes, season)
      }

      return this._addSeasonalSeason(show, episodes, season, slug)
    }).then(() => this._updateEpisodes(show))
      .catch(err => logger.error(err))
  }

  /**
   * Get TV show images from TMDB.
   * @param {!number} tmdbId - The tmdb id of the show you want the images
   * from.
   * @returns {Object} - Object with banner, fanart and poster images.
   */
  _getTmdbImages(tmdbId: number): Object {
    return tmdb.tv.images({
      tv_id: tmdbId
    }).then(i => {
      const baseUrl = 'https://image.tmdb.org/t/p/w500'

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
   * Get TV show images from TVDB.
   * @param {!number} tvdbId - The tvdb id of the show you want the images
   * from.
   * @returns {Object} - Object with banner, fanart and poster images.
   */
  _getTvdbImages(tvdbId: number): Object {
    return tvdb.getSeriesById(tvdbId).then(i => {
      const baseUrl = 'https://thetvdb.com/banners/'

      const { Holder } = AbstractHelper
      const images = {
        banner: i.banner ? `${baseUrl}${i.banner}` : Holder,
        fanart: i.banner ? `${baseUrl}${i.banner}` : Holder,
        poster: i.banner ? `${baseUrl}${i.banner}` : Holder
      }

      return this.checkImages(images)
    })
  }

  /**
   * Get TV show images from Fanart.
   * @param {!number} tvdbId - The tvdb id of the show you want the images
   * from.
   * @returns {Object} - Object with banner, fanart and poster images.
   */
  _getFanartImages(tvdbId: number): Object {
    return fanart.getShowImages(tvdbId).then(i => {
      const { Holder } = AbstractHelper
      const images = {
        banner: i.tvbanner ? i.tvbanner[0].url : Holder,
        fanart: i.showbackground
          ? i.showbackground[0].url
          : i.clearart
            ? i.clearart[0].url
            : Holder,
        poster: i.tvposter ? i.tvposter[0].url : Holder
      }

      return this.checkImages(images)
    })
  }

  /**
   * Get TV show images.
   * @override
   * @protected
   * @param {!number} tmdbId - The tmdb id of the show you want the images
   * from.
   * @param {!number} tvdbId - The tvdb id of the show you want the images
   * from.
   * @returns {Promise<Object>} - Object with banner, fanart and poster images.
   */
  getImages({tmdbId, tvdbId}: Object): Promise<Object> {
    return this._getTmdbImages(tmdbId)
      .catch(() => this._getTvdbImages(tvdbId))
      .catch(() => this._getFanartImages(tmdbId))
      .catch(() => AbstractHelper.DefaultImages)
  }

  /**
   * Get info from Trakt and make a new show object.
   * @override
   * @param {!string} id - The slug to query https://trakt.tv/.
   * @returns {Show} - A new show without the episodes attached.
   */
  async getTraktInfo(id: string): Show {
    try {
      const traktShow = await trakt.shows.summary({
        id,
        extended: 'full'
      })
      const traktWatchers = await trakt.shows.watching({ id })

      if (!traktShow) {
        return logger.warn(`No show found for slug: '${id}'`)
      }

      const { ids } = traktShow
      const { imdb, tmdb, slug, tvdb } = ids
      if (!imdb || !tmdb || !tvdb) {
        return logger.warn(`No ids found for slug: '${id}'`)
      }

      const images = await this.getImages({
        tmdbId: tmdb,
        tvdbId: tvdb
      })

      return {
        imdb_id: imdb,
        title: traktShow.title,
        year: traktShow.year,
        slug,
        synopsis: traktShow.overview,
        runtime: traktShow.runtime,
        rating: {
          votes: traktShow.votes,
          watching: traktWatchers ? traktWatchers.length : 0,
          percentage: Math.round(traktShow.rating * 10)
        },
        images,
        genres: traktShow.genres ? traktShow.genres : ['unknown'],
        tvdb_id: tvdb,
        country: traktShow.country,
        network: traktShow.network,
        air_day: traktShow.airs.day,
        air_time: traktShow.airs.time,
        status: traktShow.status,
        num_seasons: 0,
        last_updated: Number(new Date()),
        latest_episode: 0,
        episodes: []
      }
    } catch (err) {
      logger.error(`Trakt: Could not find any data on: ${err.path || err} with slug: '${id}'`)
    }
  }

}
