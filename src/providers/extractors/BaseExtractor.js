// Import the neccesary modules.
import asyncq from "async-q";

import Util from "../../Util";

/** Class for base extracting data from torrents. */
export default class BaseExtractor {

   /**
    * Create a base extractor object.
    * @param {String} name - The name of the content provider.
    * @param {Object} contentProvider - The content provider to extract content from.
    */
  constructor(name, contentProvider) {
    /**
     * The name of the torrent provider.
     * @type {String}
     */
    this.name = name;

    /**
     * The content provider used by the extractor.
     * @type {Object}
     */
    this._contentProvider = contentProvider;

    /**
     * The util object with general functions.
     * @type {Util}
     */
    this._util = new Util();
  }

  /**
   * Get all the torrents of a given provider.
   * @param {Integer} totalPages - The total pages of the query.
   * @param {Object} provider - The provider to query the content provider.
   * @returns {Array} - A list of all the queried torrents.
   */
  async _getAllTorrents(totalPages, provider) {
    try {
      let torrents = [];
      await asyncq.timesSeries(totalPages, async page => {
        try {
          if (provider.query.page) provider.query.page = page + 1;
          if (provider.query.offset) provider.query.offset = page + 1;

          logger.info(`${this.name}: Starting searching ${this.name} on page ${page + 1} out of ${totalPages}`);
          const result = await this._contentProvider.search(provider.query);
          torrents = torrents.concat(result.results);
        } catch (err) {
          return this._util.onError(err);
        }
      });
      logger.info(`${this.name}: Found ${torrents.length} torrents.`);
      return torrents;
    } catch (err) {
      return this._util.onError(err);
    }
  }

}
