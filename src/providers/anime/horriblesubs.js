// Import the neccesary modules.
import asyncq from "async-q";
import HorribleSubsAPI from "horriblesubs-api";
import { global } from "../../config/constants";
import Helper from "./helper";
import Util from "../../util";

/**
 * @class
 * @classdesc The factory function for scraping anime from {@link https://horriblesubs.info/}.
 * @memberof module:providers/anime/horriblesubs
 * @param {String} name - The name of the HorribleSubs provider.
 * @property {Object} helper - The helper object for adding anime.
 * @property {Object} util - The util object with general functions.
 */
export default class HorribleSubs {

  constructor(name) {
    this.name = name;
    this.horriblesubsAPI = new HorribleSubsAPI();
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
  async getAnime(horribleSubsAnime) {
    try {
      if (horribleSubsAnime) {
        horribleSubsAnime = await this.horriblesubsAPI.getAnimeData(horribleSubsAnime);
        const newShow = await this.helper.getHummingbirdInfo(horribleSubsAnime.slug);

        if (newShow && newShow._id) {
          delete horribleSubsAnime.episodes[0];
          return await this.helper.addEpisodes(newShow, horribleSubsAnime.episodes, horribleSubsAnime.slug);
        }
      }
    } catch (err) {
      return this.util.onError(err);
    }
  };

  /**
   * @description Returns a list of all the inserted torrents.
   * @function HorribleSubs#search
   * @memberof module:providers/anime/horriblesubs
   * @returns {Array} - A list of scraped animes.
   */
  async search() {
    try {
      console.log(`${this.name}: Starting scraping...`);
      const horribleSubsAnimes = await this.horriblesubsAPI.getAllAnime();
      console.log(`${this.name}: Found ${horribleSubsAnimes.length} anime shows.`);
      return await asyncq.mapLimit(horribleSubsAnimes, global.maxWebRequest, async horribleSubsAnime => {
        try {
          return await this.getAnime(horribleSubsAnime);
        } catch (err) {
          return this.util.onError(err);
        }
      });
    } catch (err) {
      return this.util.onError(err);
    }
  };

};
