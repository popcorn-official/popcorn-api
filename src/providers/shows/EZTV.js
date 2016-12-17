// Import the neccesary modules.
import asyncq from "async-q";
import EztvAPI from "eztv-api-pt";

import Extractor from "../extractors/ShowExtractor";
import Util from "../../Util";
import { maxWebRequest } from "../../config/constants";

/** Class for scraping shows from https://eztv.ag/. */
export default class EZTV {

  /**
   * Create an eztv object for show content.
   * @param {String} name - The name of the torrent provider.
   * @param {?Boolean} debug - Debug mode for extra output.
   */
  constructor(name, debug) {
    /**
     * The name of the torrent provider.
     * @type {String}
     */
    this.name = name;

    /**
     * A configured EZTV API.
     * @type {EztvAPI}
     * @see https://github.com/ChrisAlderson/eztv-api-pt
     */
    this._eztv = new EztvAPI({ debug });

    /**
     * The extractor object for getting show data on torrents.
     * @type {Extractor}
     */
    this._extractor = new Extractor(this.name, this._eztv, debug);

    /**
     * The util object with general functions.
     * @type {Util}
     */
    this._util = new Util();
  }

  /**
   * Returns a list of all the inserted torrents.
   * @returns {Show[]} - A list of scraped shows.
   */
  async search() {
    try {
      logger.info(`${this.name}: Starting scraping...`);
      const shows = await this._eztv.getAllShows();
      logger.info(`${this.name}: Found ${shows.length} shows.`);

      return await asyncq.mapLimit(shows, maxWebRequest, async show => {
        try {
          show = await this._eztv.getShowData(show);
          return await this._extractor.getShow(show);
        } catch (err) {
          return this._util.onError(err);
        }
      });
    } catch (err) {
      return this._util.onError(err);
    }
  }

}
