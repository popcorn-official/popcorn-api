// Import the neccesary modules.
import asyncq from "async-q";
import HorribleSubsAPI from "horriblesubs-api";

import Extractor from "../extractors/AnimeExtractor";
import Util from "../../Util";
import { maxWebRequest } from "../../config/constants";

/** Class for scraping anime from https://horriblesubs.info/. */
export default class HorribleSubs {

  /**
   * Create an horriblesubs object for anime content.
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
     * A configured HorribleSubs API.
     * @type {HorribleSubsAPI}
     * @see https://github.com/ChrisAlderson/horriblesubs-api
     */
    this._horriblesubs = new HorribleSubsAPI({
      cloudflare: true,
      debug
    });

    /**
     * The extractor object for getting show data on torrents.
     * @type {Extractor}
     */
    this._extractor = new Extractor(this.name, this._horriblesubs, debug);

    /**
     * The util object with general functions.
     * @type {Util}
     */
    this._util = new Util();
  }

  /**
   * Returns a list of all the inserted torrents.
   * @returns {Anime[]} - A list of scraped animes.
   */
  async search() {
    try {
      logger.info(`${this.name}: Starting scraping...`);
      const animes = await this._horriblesubs.getAllAnime();
      logger.info(`${this.name}: Found ${animes.length} anime shows.`);

      return await asyncq.mapLimit(animes, maxWebRequest, async anime => {
        try {
          anime = await this._horriblesubs.getAnimeData(anime);
          return await this._extractor.getAnime(anime);
        } catch (err) {
          return this._util.onError(err);
        }
      });
    } catch (err) {
      return this._util.onError(err);
    }
  }

}
