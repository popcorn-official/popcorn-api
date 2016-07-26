// Import the neccesary modules.
import fs from "fs";
import path from "path";
import Anime from "../models/Anime";
import { global } from "../config/constants";
import Movie from "../models/Movie";
import packageJSON from "../../package.json";
import Show from "../models/Show";
import Util from "../util";

/**
 * @class
 * @classdesc The factory function for displaying information about the
 * server the API is running on.
 * @memberof module:controllers/index
 */
export default class Index {

  constructor() {
    Index.util = new Util();
  };

  /**
   * @description Displays a given file.
   * @function Index#displayFile
   * @memberof module:controllers/index
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @param {String} path - The path to the file.
   * @param {String} file - The name of the file.
   * @returns {File} - A file to display in the browser.
   */
  static displayFile(req, res, root, file) {
    if (fs.existsSync(path.join(root, file))) {
      return res.sendFile(file, {
        root,
        headers: {
          "Content-Type": "text/plain; charset=UTF-8"
        }
      });
    } else {
      const errorMsg = `Could not find file: '${root}'`;
      return res.json({
        error: errorMsg
      });
    }
  };

  /**
   * @description Get general information about the server.
   * @function Index#getIndex
   * @memberof module:controllers/index
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @returns {Object} - General information about the server.
   */
  async getIndex(req, res) {
    try {
      const lastUpdatedJSON = JSON.parse(fs.readFileSync(`${global.tempDir}/${global.updatedFile}`, "utf8")),
        statusJSON = JSON.parse(fs.readFileSync(`${global.tempDir}/${global.statusFile}`, "utf8")),
        commit = await Index.util.executeCommand("git rev-parse --short HEAD"),
        animeCount = await Anime.count({num_episodes: {$gt: 0}}).exec(),
        movieCount = await Movie.count().exec(),
        showCount = await Show.count({num_seasons: {$gt: 0}}).exec();

      return res.json({
        repo: packageJSON.repository.url,
        server: global.serverName,
        status: statusJSON.status,
        totalAnimes: animeCount,
        totalMovies: movieCount,
        totalShows: showCount,
        updated: lastUpdatedJSON.lastUpdated,
        uptime: process.uptime() | 0,
        version: packageJSON.version,
        commit
      });
    } catch (err) {
      return res.json(err);
    }
  };

  /**
   * @description Displays the 'popcorn-api.log' file.
   * @function Index#getErrorLog
   * @memberof module:controllers/index
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @returns {File} - The content of the log file.
   */
  getErrorLog(req, res) {
    return Index.displayFile(req, res, `${global.tempDir}`, `${packageJSON.name}.log`);
  };

};
