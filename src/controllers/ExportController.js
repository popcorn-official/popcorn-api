// Import the neccesary modules.
import fs from "fs";
import path from "path";

import Util from "../Util";
import { tempDir } from "../config/constants";

/** Class for getting anime data from the MongoDB. */
export default class ExportController {

  /** Create an export controller object. */
  constructor() {
    /**
     * The util object with general functions.
     * @type {Util}
     */
    this._util = new Util();
  }

  /**
   * Download the export of a collection.
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @returns {Download} - The download of an export of a collection.
   */
  getExport(req, res) {
    const collection = req.params.collection;
    let err;

    if (collection.match(/(anime)$|(movie)$|(show)$/i)) {
      const jsonFile = path.join(tempDir, `${collection}s.json`);
      if (!fs.existsSync(jsonFile)) {
        err = {error: `Error: no such file found for '${jsonFile}'`};
        return res.status(500).json(err);
      } else {
        return res.status(201).download(jsonFile);
      }
    } else {
      err = {error: `Error: '${collection}' is not a valid collection to export.`};
      res.status(500).json(err);
    }
  }

}
