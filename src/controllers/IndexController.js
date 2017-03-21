// Import the neccesary modules.
/* eslint-disable no-bitwise */
import fs from 'fs';
import path from 'path';

import { AnimeShow as Anime } from '../models/Anime';
import Movie from '../models/Movie';
import Show from '../models/Show';
import AnimeController from './AnimeController';
import ShowController from './ShowController';
import { executeCommand } from '../utils';
import {
  server,
  statusFile,
  tempDir,
  updatedFile
} from '../config/constants';
import {
  name,
  repository,
  version
} from '../../package.json';

/** Class for displaying information about the server the API is running on. */
export default class IndexController {

  /**
   * Displays a given file.
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @param {String} root - The path to the file.
   * @param {String} file - The name of the file.
   * @returns {JSON | File} - A file to display in the browser.
   */
  static _displayFile(req, res, root, file) {
    if (fs.existsSync(path.join(root, file))) {
      return res.status(204).sendFile(file, {
        root,
        headers: {
          'Content-Type': 'text/plain; charset=UTF-8'
        }
      });
    }

    return res.json({
      error: `Could not find file: '${root}'`
    });
  }

  /**
   * Get general information about the server.
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @param {Function} next - The next function for Express.
   * @returns {JSON} - General information about the server.
   */
  async getIndex(req, res, next) {
    try {
      const { updated } = JSON.parse(fs.readFileSync(path.join(tempDir, updatedFile), 'utf8'));
      const { status } = JSON.parse(fs.readFileSync(path.join(tempDir, statusFile), 'utf8'));
      const commit = await executeCommand('git rev-parse --short HEAD');
      const totalAnimes = await Anime.count(AnimeController.query).exec();
      const totalMovies = await Movie.count().exec();
      const totalShows = await Show.count(ShowController.query).exec();

      return res.json({
        repo: repository.url,
        server,
        status,
        totalAnimes,
        totalMovies,
        totalShows,
        updated,
        uptime: process.uptime() | 0,
        version,
        commit
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Displays the 'popcorn-api.log' file.
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @returns {File} - The content of the log file.
   */
  getErrorLog(req, res) {
    return IndexController._displayFile(req, res, tempDir, `${name}.log`);
  }

}
