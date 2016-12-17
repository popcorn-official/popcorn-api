// Import the neccesary modules.
import asyncq from "async-q";

import BaseExtractor from "./BaseExtractor";
import Helper from "../helpers/ShowHelper";
import Util from "../../Util";
import { maxWebRequest, showMap } from "../../config/constants";

/** Class for extracting TV shows from torrents. */
export default class Extractor extends BaseExtractor {

   /**
    * Create an extratorrent object for show content.
    * @param {String} name - The name of the content provider.
    * @param {Object} contentProvider - The content provider to extract content from.
    * @param {?Boolean} debug - Debug mode for extra output.
    */
  constructor(name, contentProvider, debug) {
    super(name, contentProvider);

    /**
     * The helper object for adding shows.
     * @type {Helper}
     */
    this._helper = new Helper(this.name);

    /**
     * The util object with general functions.
     * @type {Util}
     */
    this._util = new Util();
  }

  /**
   * Get all the shows.
   * @param {Object} show - The show information.
   * @returns {Show} - A show.
   */
  async getShow(show) {
    try {
      const newShow = await this._helper.getTraktInfo(show.slug);
      if (newShow && newShow._id) {
        delete show.episodes[0];
        return await this._helper.addEpisodes(newShow, show.episodes, show.slug);
      }
    } catch (err) {
      return this._util.onError(err);
    }
  }

  /**
   * Extract show information based on a regex.
   * @param {Object} torrent - The torrent to extract the show information from.
   * @param {Regex} regex - The regex to extract the show information.
   * @param {Boolean} dateBased - Check for dateBased episodes.
   * @returns {Object} - Information about a show from the torrent.
   */
  _extractShow(torrent, regex, dateBased) {
    let showTitle = torrent.title.match(regex)[1];
    if (showTitle.endsWith(" ")) showTitle = showTitle.substring(0, showTitle.length - 1);
    showTitle = showTitle.replace(/\./g, " ");
    let slug = showTitle.replace(/[^a-zA-Z0-9 ]/gi, "").replace(/\s+/g, "-").toLowerCase();
    if (slug.endsWith("-")) slug = slug.substring(0, slug.length - 1);
    slug = slug in showMap ? showMap[slug] : slug;
    let season = torrent.title.match(regex)[2];
    let episode = torrent.title.match(regex)[3];
    if (!dateBased) {
      season = parseInt(season, 10);
      episode = parseInt(episode, 10);
    }
    const quality = torrent.title.match(/(\d{3,4})p/) !== null ? torrent.title.match(/(\d{3,4})p/)[0] : "480p";

    const episodeTorrent = {
      url: torrent.magnet ? torrent.magnet : torrent.torrent_link,
      seeds: torrent.seeds ? torrent.seeds : 0,
      peers: torrent.peers ? torrent.peers : 0,
      provider: this.name
    };

    const show = {
      showTitle,
      slug,
      torrentLink: torrent.link,
      season,
      episode,
      quality,
      dateBased
    };
    show.episodes = {};

    if (!show.episodes[season]) show.episodes[season] = {};
    if (!show.episodes[season][episode]) show.episodes[season][episode] = {};
    if ((!show.episodes[season][episode][quality] || show.showTitle.toLowerCase().indexOf("repack") > -1) || (show.episodes[season][episode][quality] && show.episodes[season][episode][quality].seeds < episodeTorrent.seeds))
      show.episodes[season][episode][quality] = episodeTorrent;

    return show;
  }

  /**
   * Get show info from a given torrent.
   * @param {Object} torrent - A torrent object to extract show information from.
   * @returns {Object} - Information about a show from the torrent.
   */
  _getShowData(torrent) {
    const seasonBased = /(.*).[sS](\d{2})[eE](\d{2})/i;
    const vtv = /(.*).(\d{1,2})[x](\d{2})/i;
    const dateBased = /(.*).(\d{4}).(\d{2}.\d{2})/i;
    if (torrent.title.match(seasonBased)) {
      return this._extractShow(torrent, seasonBased, false);
    } else if (torrent.title.match(vtv)) {
      return this._extractShow(torrent, vtv, false);
    } else if (torrent.title.match(dateBased)) {
      return this._extractShow(torrent, dateBased, true);
    } else {
      logger.warn(`${this.name}: Could not find data from torrent: '${torrent.title}'`);
    }
  }

  /**
   * Puts all the found shows from the torrents in an array.
   * @param {Array} torrents - A list of torrents to extract show information.
   * @returns {Array} - A list of objects with show information extracted from the torrents.
   */
  async _getAllShows(torrents) {
    try {
      const shows = [];

      await asyncq.mapSeries(torrents, torrent => {
        if (torrent) {
          const show = this._getShowData(torrent);
          if (show) {
            if (shows.length != 0) {
              const { showTitle, slug, season, episode, quality } = show;
              const matching = shows
                .filter(s => s.showTitle === showTitle)
                .filter(s => s.slug === slug);

              if (matching.length != 0) {
                const index = shows.indexOf(matching[0]);
                if (!matching[0].episodes[season]) matching[0].episodes[season] = {};
                if (!matching[0].episodes[season][episode]) matching[0].episodes[season][episode] = {};
                if ((!matching[0].episodes[season][episode][quality] || matching[0].showTitle.toLowerCase().indexOf("repack") > -1) || (matching[0].episodes[season][episode][quality] && matching[0].episodes[season][episode][quality].seeds < show.episodes[season][episode][quality].seeds))
                  matching[0].episodes[season][episode][quality] = show.episodes[season][episode][quality];

                shows.splice(index, 1, matching[0]);
              } else {
                shows.push(show);
              }
            } else {
              shows.push(show);
            }
          }
        }
      });

      return shows;
    } catch (err) {
      this._util.onError(err);
    }
  }

  /**
   * Returns a list of all the inserted torrents.
   * @param {Object} provider - The provider to query the content provider.
   * @returns {Show[]} - A list of scraped shows.
   */
  async search(provider) {
    try {
      const getTotalPages = await this._contentProvider.search(provider.query);
      const totalPages = getTotalPages.total_pages; // Change to 'const' for production.
      if (!totalPages) return this._util.onError(`${this.name}: total_pages returned; '${totalPages}'`);
      // totalPages = 3; // For testing purposes only.
      logger.info(`${this.name}: Total pages ${totalPages}`);

      const torrents = await this._getAllTorrents(totalPages, provider);
      const shows = await this._getAllShows(torrents);
      return await asyncq.mapLimit(shows, maxWebRequest, show => this.getShow(show));
    } catch (err) {
      return this._util.onError(err);
    }
  }

}
