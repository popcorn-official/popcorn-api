// Import the neccesary modules.
import asyncq from "async-q";
import ExtraTorrentAPI from "extratorrent-api";

import Extractor from "../extractors/MovieExtractor";
import Util from "../../Util";

/** Class for scraping movies from https://extratorrent.cc/. */
export default class ExtraTorrent {

  /**
   * Create an extratorrent object for movie content.
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
     * The extractor object for getting movie data on torrents.
     * @type {Extractor}
     */
    this._extractor = new Extractor(this.name, new ExtraTorrentAPI({ debug }), debug);

    /**
     * The util object with general functions.
     * @type {Util}
     */
    this._util = new Util();
  }

  /**
   * Returns a list of all the inserted torrents.
   * @param {Object} provider - The provider to query https://extratorrent.cc/.
   * @returns {Movie[]} - A list of scraped movies.
   */
  async search(provider) {
    try {
      logger.info(`${this.name}: Starting scraping...`);
      provider.query.category = "movies";
      provider.query.page = 1;
      provider.query.language = provider.query.language ? provider.query.language : "en";

      return await this._extractor.search(provider);
    } catch (err) {
      return this._util.onError(err);
    }
  }

}
