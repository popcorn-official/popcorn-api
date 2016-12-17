// Import the neccesary modules.
import asyncq from "async-q";
import NyaaAPI from "nyaa-api-pt";

import Extractor from "../extractors/AnimeExtractor";
import Util from "../../Util";

/** Class for scraping anime shows from https://nyaa.se/. */
export default class Nyaa {

   /**
    * Create an extratorrent object for anime content.
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
    this._extractor = new Extractor(this.name, new NyaaAPI({ debug }), debug);

    /**
     * The util object with general functions.
     * @type {Util}
     */
    this._util = new Util();
  }

  /**
   * Returns a list of all the inserted torrents.
   * @param {Object} provider - The provider to query https://nyaa.se/.
   * @returns {Anime[]} - A list of scraped anime shows.
   */
  async search(provider) {
    try {
      logger.info(`${this.name}: Starting scraping...`);
      provider.query.category = "anime";
      provider.query.sub_category = "english_translated";
      provider.query.offset = 1;

      return await this._extractor.search(provider);
    } catch (err) {
      return this._util.onError(err);
    }
  }

}
