// Import the neccesary modules.
import childProcess from "child_process";
import fs from "fs";
import fse from "fs-extra";
import path from "path";

import { dbName, statusFile, tempDir, updatedFile } from "./config/constants";
import { name } from "../package.json";

/** Class holding the frequently used functions. */
export default class Util {

  /**
   * Create an emty file.
   * @param {String} path - The path to the file to create.
   */
  _createEmptyFile(path) {
    fs.createWriteStream(path).end();
  }

  /** Create the temporary directory. */
  createTemp() {
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    if (fs.existsSync(tempDir)) this._resetTemp();

    this._createEmptyFile(path.join(tempDir, statusFile));
    this._createEmptyFile(path.join(tempDir, updatedFile));
  }

  /**
   * Execute a command from within the root folder.
   * @param {String} cmd - The command to execute.
   * @returns {Promise} - The output of the command.
   */
  executeCommand(cmd) {
    return new Promise((resolve, reject) => {
      childProcess.exec(cmd, {
        cwd: __dirname
      }, (err, stdout) => {
        if (err) return reject(err);
        return resolve(stdout.split("\n").join(""));
      });
    });
  }

  /**
   * Export a collection to a JSON file.
   * @param {String} collection - The collection to export.
   * @returns {Promise} - The output of the mongoexport command.
   */
  exportCollection(collection) {
    const jsonFile = path.join(tempDir, `${collection}s.json`);
    logger.info(`Exporting collection: '${collection}s', to: '${jsonFile}'`);

    return this.executeCommand(`mongoexport --db ${dbName} --collection ${collection}s --out "${jsonFile}"`);
  }

  /**
   * Import a json file to a collection.
   * @param {String} collection - The collection to import.
   * @param {String} jsonFile - The json file to import..
   * @returns {Promise} - The output of the mongoimport command.
   */
  importCollection(collection, jsonFile) {
    if (!path.isAbsolute(jsonFile)) jsonFile = path.join(process.cwd(), jsonFile);
    if (!fs.existsSync(jsonFile)) throw new Error(`Error: no such file found for '${jsonFile}'`);

    logger.info(`Importing collection: '${collection}', from: '${jsonFile}'`);

    return this.executeCommand(`mongoimport --db ${dbName} --collection ${collection}s --file "${jsonFile}" --upsert`);
  }

  /**
   * Error logger function.
   * @param {String} errorMessage - The error message you want to display.
   * @returns {Error} - A new error with the given error message.
   */
  onError(errorMessage) {
    logger.error(errorMessage);
    return new Error(errorMessage);
  }

  /** Reset the default log file. */
  resetLog() {
    const logFile = path.join(tempDir, `${name}.log`);
    if (fs.existsSync(logFile)) fs.unlinkSync(logFile);
  }

  /**
   * Removes all the files in the temporary directory.
   * @param {String} [tmpPath=popcorn-api/tmp] - The path to remove all the files within (Default is set in the `config/constants.js`).
   */
  _resetTemp(tmpPath = tempDir) {
    const files = fs.readdirSync(tmpPath);
    files.forEach(file => {
      const stats = fs.statSync(path.join(tmpPath, file));
      if (stats.isDirectory()) {
        this.resetTemp(file);
      } else if (stats.isFile()) {
        fs.unlinkSync(path.join(tmpPath, file));
      }
    });
  }

  /**
   * Search for a key in an array of object.
   * @param {String} key - The key to search for.
   * @param {String} value - The value of the key to search for.
   * @return {Object} - The object with the correct key-value pair.
   */
  search(key, value) {
    return element => element[key] === value;
  }

  /**
   * Updates the `lastUpdated.json` file.
   * @param {String} [updated=Date.now()] - The epoch time when the API last started scraping.
   */
  setLastUpdated(updated = (Math.floor(new Date().getTime() / 1000))) {
    fs.writeFile(path.join(tempDir, updatedFile), JSON.stringify({
      updated
    }), () => {});
  }

  /**
   * Updates the `status.json` file.
   * @param {String} [status=Idle] - The status which will be set to in the `status.json` file.
   */
  setStatus(status = "Idle") {
    fs.writeFile(path.join(tempDir, statusFile), JSON.stringify({
      status
    }), () => {});
  }

  /**
   * Check that all images are fetched from the provider.
   * @param {Object} images - The images.
   * @param {String} holder - The image holder.
   * @throws {Error} - 'An image could not been found'.
   */
  checkImages(images, holder) {
    for (let image of images) {
      if (image === holder) {
        throw new Error('An image could not been found');
      }
    }
  }

}
