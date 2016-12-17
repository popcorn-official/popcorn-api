// Import the neccesary modules.
import asyncq from "async-q";
import HummingbirdAPI from "hummingbird-api";

import Anime from "../../models/Anime";
import Util from "../../Util";

/** class for saving anime shows. */
export default class Helper {

  /**
   * Create an helper object for anime content.
   * @param {String} name - The name of the content provider.
   * @param {?Boolean} debug - Debug mode for extra output.
   */
  constructor(name, debug) {
    /**
     * The name of the torrent provider.
     * @type {String}
     */
    this.name = name;

    /**
     * A configured HummingBird API.
     * @type {HummingbirdAPI}
     * @see https://github.com/ChrisAlderson/hummingbird-api
     */
    this._hummingbird = new HummingbirdAPI({ debug });

    /**
     * The util object with general functions.
     * @type {Util}
     */
    this._util = new Util();
  }

  /**
   * Update the number of seasons of a given anime.
   * @param {Anime} anime - The anime to update the number of seasons.
   * @returns {Anime} - A newly updated anime.
   */
  async _updateNumSeasons(anime) {
    const saved = await Anime.findOneAndUpdate({
      _id: anime._id
    }, anime, {
      new: true,
      upsert: true
    }).exec();

    const distinct = await Anime.distinct("episodes.season", {
      _id: saved._id
    }).exec();
    saved.num_seasons = distinct.length;

    return await Anime.findOneAndUpdate({
      _id: saved._id
    }, saved, {
      new: true,
      upsert: true
    }).exec();
  }

  /**
   * Update the torrents for an existing anime.
   * @param {Object} matching - The matching episode of new the anime.
   * @param {Object} found - The matching episode existing anime.
   * @param {Anime} anime - The anime to merge the episodes to.
   * @param {String} quality - The quality of the torrent.
   * @returns {Anime} - An anime with merged torrents.
   */
  _updateEpisode(matching, found, anime, quality) {
    const index = anime.episodes.indexOf(matching);

    if (found.torrents[quality] && matching.torrents[quality]) {
      let update = false;

      if (found.torrents[quality].seeds > matching.torrents[quality].seeds) {
        update = true;
      } else if (matching.torrents[quality].seeds > found.torrents[quality].seeds) {
        update = false;
      } else if (found.torrents[quality].url === matching.torrents[quality].url) {
        update = true;
      }

      if (update) {
        if (quality === "480p") matching.torrents["0"] = found.torrents[quality];
        matching.torrents[quality] = found.torrents[quality];
      }
    } else if (found.torrents[quality] && !matching.torrents[quality]) {
      if (quality === "480p") matching.torrents["0"] = found.torrents[quality];
      matching.torrents[quality] = found.torrents[quality];
    }

    anime.episodes.splice(index, 1, matching);
    return anime;
  }

  /**
   * Update a given anime with it's associated episodes.
   * @param {Anime} anime - The anime to update its episodes.
   * @returns {Anime} - A newly updated anime.
   */
  async _updateEpisodes(anime) {
    try {
      const found = await Anime.findOne({
        _id: anime._id
      }).exec();
      if (found) {
        logger.info(`${this.name}: '${found.title}' is an existing anime.`);
        for (let i = 0; i < found.episodes.length; i++) {
          let matching = anime.episodes
            .filter(animeEpisode => animeEpisode.episode === found.episodes[i].episode);

          if (matching.length != 0) {
            anime = this._updateEpisode(matching[0], found.episodes[i], anime, "480p");
            anime = this._updateEpisode(matching[0], found.episodes[i], anime, "720p");
            anime = this._updateEpisode(matching[0], found.episodes[i], anime, "1080p");
          } else {
            anime.episodes.push(found.episodes[i]);
          }
        }

        return await this._updateNumSeasons(anime);
      } else {
        logger.info(`${this.name}: '${anime.title}' is a new anime!`);
        const newAnime = await new Anime(anime).save();
        return await this._updateNumSeasons(newAnime);
      }
    } catch (err) {
      return this._util.onError(err);
    }
  }

  /**
   * Adds one season to a anime.
   * @param {Anime} anime - The anime to add the torrents to.
   * @param {Object} episodes - The episodes containing the torrents.
   * @param {Integer} seasonNumber - The season number.
   * @param {String} slug - The slug of the anime.
   */
  async _addSeason(anime, episodes, seasonNumber, slug) {
    try {
      await asyncq.each(Object.keys(episodes[seasonNumber]), episodeNumber => {
        const episode = {
          title: `Episode ${episodeNumber}`,
          torrents: {},
          season: seasonNumber,
          episode: episodeNumber,
          overview: `We still don't have single episode overviews for anime… Sorry`,
          tvdb_id: `${anime._id}-1-${episodeNumber}`
        };

        episode.torrents = episodes[seasonNumber][episodeNumber];
        episode.torrents[0] = episodes[seasonNumber][episodeNumber]["480p"]
          ? episodes[seasonNumber][episodeNumber]["480p"] : episodes[seasonNumber][episodeNumber]["720p"];
        anime.episodes.push(episode);
      });
    } catch (err) {
      return this._util.onError(`Hummingbird: Could not find any data on: ${err.path || err} with slug: '${slug}'`);
    }
  }

  /**
   * Get info from Hummingbird and make a new anime object.
   * @param {String} slug - The slug to query https://hummingbird.me/.
   * @returns {Anime} - A new anime without the episodes attached.
   */
  async getHummingbirdInfo(slug) {
    const holder = "images/posterholder.png";

    try {
      const hummingbirdAnime = await this._hummingbird.Anime.getAnime(slug);

      let type;
      if (hummingbirdAnime.show_type.match(/tv/i)) {
        type = "show";
      } else {
        type = "movie";
      }

      const genres = hummingbirdAnime.genres.map(genre => genre.name);

      if (hummingbirdAnime && hummingbirdAnime.id) {
        return {
          _id: hummingbirdAnime.id,
          mal_id: hummingbirdAnime.mal_id,
          title: hummingbirdAnime.title,
          year: new Date(hummingbirdAnime.started_airing).getFullYear(),
          slug: hummingbirdAnime.slug,
          synopsis: hummingbirdAnime.synopsis,
          runtime: hummingbirdAnime.episode_length,
          status: hummingbirdAnime.status,
          rating: {
            hated: 100,
            loved: 100,
            votes: 0,
            watching: 0,
            percentage: (Math.round(hummingbirdAnime.community_rating * 10)) * 2
          },
          type,
          num_seasons: 0,
          last_updated: Number(new Date()),
          images: {
            banner: hummingbirdAnime.cover_image !== null ? hummingbirdAnime.cover_image : holder,
            fanart: hummingbirdAnime.cover_image !== null ? hummingbirdAnime.cover_image : holder,
            poster: hummingbirdAnime.cover_image !== null ? hummingbirdAnime.cover_image : holder
          },
          genres: genres !== null ? genres : ["unknown"],
          episodes: []
        };
      }
    } catch (err) {
      return this._util.onError(`Hummingbird: Could not find any data on: ${err.path || err} with slug: '${slug}'`);
    }
  }

  /**
   * Adds episodes to a anime.
   * @param {Show} anime - The anime to add the torrents to.
   * @param {Object} episodes - The episodes containing the torrents.
   * @param {String} slug - The slug of the anime.
   * @returns {Anime} - A anime with updated torrents.
   */
  async addEpisodes(anime, episodes, slug) {
    try {
      await asyncq.each(Object.keys(episodes), seasonNumber => this._addSeason(anime, episodes, seasonNumber, slug));
      return await this._updateEpisodes(anime);
    } catch (err) {
      return this._util.onError(err);
    }
  }

}
