// Import the neccesary modules.
import asyncq from "async-q";
import KatAPI from "kat-api-pt";

import Extractor from "../extractors/AnimeExtractor";
import Util from "../../Util";

/** Class for scraping anime shows from https://kat.cr/. */
export default class KAT {

  /**
   * Create a kat object for anime content.
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
     * The extractor object for getting anime data on torrents.
     * @type {Extractor}
     */
    this._extractor = new Extractor(this.name, new KatAPI({ debug }), debug);

    /**
     * The util object with general functions.
     * @type {Util}
     */
    this._util = new Util();
  }

  /**
   * Returns a list of all the inserted torrents.
   * @param {Object} provider - The provider to query https://kat.cr/.
   * @returns {Anime[]} - A list of scraped anime shows.
   */
  async search(provider) {
    try {
      logger.info(`${this.name}: Starting scraping...`);
      provider.query.page = 1;
      provider.query.verified = 1;
      provider.query.adult_filter = 1;
      provider.query.category = "english-translated";

      return await this._extractor.search(provider);
    } catch (err) {
      this._util.onError(err);
    }
  }

}
