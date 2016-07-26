// Import the neccesary modules.
import childProcess from "child_process";
import fs from "fs";
import HummingbirdAPI from "hummingbird-api";
import path from "path";
import Trakt from "trakt.tv";
import { global } from "./config/constants";

/**
 * @class
 * @classdesc The factory function for the frequently used functions.
 * @memberof module:global/util
 * @property {Object} trakt - A configured trakt api.
 */
export default class Util {

  constructor() {
    this.trakt = new Trakt({client_id: global.traktKey});
    this.hummingbirdAPI = new HummingbirdAPI();
  };

  /**
   * @description Execute a command from within the root folder.
   * @function Util#executeCommand
   * @memberof module:global/util
   * @param {String} cmd - The command to execute.
   * @returns {String} - The output of the command.
   */
  executeCommand(cmd) {
    return new Promise((resolve, reject) => {
      childProcess.exec(cmd, {cwd: __dirname}, (err, stdout, stderr) => {
        if (err) return reject(err);
        return resolve(stdout.split("\n").join(""));
      });
    });
  };

  /**
   * @description Create an emty file.
   * @function Util#createEmptyFile
   * @memberof module:global/util
   * @param {String} path - The path to the file to create.
   */
  createEmptyFile(path) {
    return fs.createWriteStream(path).end();
  };

  /**
   * @description Created the temporary directory.
   * @function Util#createTemp
   * @memberof module:global/util
   */
  createTemp() {
    if (!fs.existsSync(global.tempDir)) fs.mkdirSync(global.tempDir);
    if (fs.existsSync(global.tempDir)) this.resetTemp();

    this.createEmptyFile(path.join(global.tempDir, global.statusFile));
    this.createEmptyFile(path.join(global.tempDir, global.updatedFile));
  };

  /**
   * @description Removes all the files in the temporary directory.
   * @function Util#resetTemp
   * @memberof module:global/util
   * @param {String} [tmpPath=popcorn-api/tmp] - The path to remove all the files within
   * (Default is set in the `global.js`).
   */
  resetTemp(tmpPath = global.tempDir) {
    const files = fs.readdirSync(tmpPath);
    files.forEach(file => {
      const stats = fs.statSync(path.join(tmpPath, file));
      if (stats.isDirectory()) {
        this.resetTemp(file);
      } else if (stats.isFile()) {
        fs.unlinkSync(path.join(tmpPath, file));
      }
    });
  };

  /**
   * @description Updates the `lastUpdated.json` file.
   * @function Util#setLastUpdated
   * @memberof module:global/util
   * @param {String} [lastUpdated=Date.now()] - The epoch time when the API last started
   * scraping.
   */
  setLastUpdated(lastUpdated = (Math.floor(new Date().getTime() / 1000))) {
    fs.writeFile(path.join(global.tempDir, global.updatedFile), JSON.stringify({
      lastUpdated: lastUpdated
    }));
  };

  /**
   * @description Updates the `status.json` file.
   * @function Util#setStatus
   * @memberof module:global/util
   * @param {String} [status=Idle] - The status which will be set to in the
   * `status.json` file (default `Idle`).
   */
  setStatus(status = "Idle") {
    fs.writeFile(path.join(global.tempDir, global.statusFile), JSON.stringify({
      "status": status
    }));
  };

  /**
   * @description Error logger function.
   * @function Util#onError
   * @memberof module:global/util
   * @param {String} errorMessage - The error message you want to display.
   * @returns {Error} - A new error with the given error message.
   */
  onError(errorMessage) {
    console.error(errorMessage);
    return new Error(errorMessage);
  };

  /**
   * @description Search for a key in an array of object.
   * @function Util#search
   * @memberof module:global/util
   * @param {String} key - The key to search for.
   * @param {String} value - The value of the key to search for.
   * @return {Object} - The object with the correct key-value pair.
   */
  search(key, value) {
    return element => element[key] === value;
  };

};
