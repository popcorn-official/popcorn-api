// Import the neccesary modules.
import asyncq from "async-q";
import eztvApi from "eztv-api-pt";
import { global } from "../../config/constants";
import Helper from "./helper";
import Util from "../../util";

/**
 * @class
 * @classdesc The factory function for scraping shows from {@link https://eztv.ag/}.
 * @memberof module:providers/show/eztv
 * @param {String} name - The name of the EZTV provider.
 * @property {Object} helper - The helper object for adding shows.
 * @property {Object} util - The util object with general functions.
 */
export default class EZTV {

  constructor(name) {
    this.name = name;
    this.eztv = new eztvApi();
    this.helper = new Helper(this.name);
    this.util = new Util();
  };

  /**
   * @description Get a complete show.
   * @function EZTV#getShow
   * @memberof module:providers/show/eztv
   * @param {Object} eztvShow - show data from eztv.
   * @returns {Show} - A complete show.
   */
  async getShow(eztvShow) {
    try {
      if (eztvShow) {
        eztvShow = await this.eztv.getShowData(eztvShow);
        const newShow = await this.helper.getTraktInfo(eztvShow.slug);

        if (newShow && newShow._id) {
          delete eztvShow.episodes.dateBased;
          delete eztvShow.episodes[0];
          return await this.helper.addEpisodes(newShow, eztvShow.episodes, eztvShow.slug);
        }
      }
    } catch (err) {
      return this.util.onError(err);
    }
  };

  /**
   * @description Returns a list of all the inserted torrents.
   * @function EZTV#search
   * @memberof module:providers/show/eztv
   * @returns {Array} - A list of scraped shows.
   */
  async search() {
    try {
      console.log(`${this.name}: Starting scraping...`);
      const eztvShows = await this.eztv.getAllShows();
      console.log(`${this.name}: Found ${eztvShows.length} shows.`);
      return await asyncq.mapLimit(eztvShows, global.maxWebRequest, async eztvShow => {
        try {
          return await this.getShow(eztvShow);
        } catch (err) {
          return this.util.onError(err);
        }
      });
    } catch (err) {
      return this.util.onError(err);
    }
  };

};
