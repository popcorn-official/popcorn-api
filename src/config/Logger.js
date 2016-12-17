// Import the neccesary modules.
import ExpressWinston from "express-winston";
import fs from "fs";
import path from "path";
import sprintf from "sprintf";
import Winston from "winston";

import { tempDir } from "./constants";
import { name } from "../../package.json";

/** Class for configuring logging. */
export default class Logger {

  /**
   * Create a logger object.
   * @param {?Boolean} [verbose] - Debug mode for no output.
   * @param {?Boolean} [debug] - Debug mode for extra output.
   */
  constructor(pretty, verbose) {
    /**
     * Pretty mode.
     * @type {Boolean}
     */
    Logger._pretty = pretty;

    /**
     * Verbose mode.
     * @type {Boolean}
     */
    Logger._verbose = verbose;

     // Create the temp directory if it does not exists.
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    /**
     * The log levels Winston will be using.
     * @type {Object}
     */
    Logger._levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    if (Logger._pretty) {
      /**
       * The Winston instance.
       * @external {Winston} https://github.com/winstonjs/winston
       */
      Logger.logger = new Winston.Logger({
        transports: [
          new Winston.transports.Console({
            name,
            levels: Logger._levels,
            formatter: Logger._consoleFormatter,
            handleExceptions: true,
            prettyPrint: true
          }),
          new Winston.transports.File({
            filename: path.join(tempDir, `${name}.log`),
            json: false,
            level: "warn",
            formatter: Logger._fileFormatter,
            maxsize: 5242880,
            handleExceptions: true
          })
        ],
        exitOnError: false
      });

      /**
       * The Express Winston instance.
       * @external {ExpressWinston} http://bithavoc.io/express-winston/
       */
      Logger.expressLogger = new ExpressWinston.logger({
        winstonInstance: Logger.logger,
        expressFormat: true
      });
    }

    // Create the logger object.
    Logger._createLogger();
  }

  /**
   * Check if the message is empty and replace it with the meta.
   * @param {Object} args - Arguments passed by Winston.
   * @returns {Object} - Formatter arguments passed by Winston.
   */
  static _checkEmptyMessage(args) {
    if (args.message === "" && Object.keys(args.meta).length !== 0)
      args.message = JSON.stringify(args.meta);

    return args;
  }

  /**
   * Get the color of the output based on the log level.
   * @param {String} level - The log level.
   * @returns {String} - A color based on the log level.
   */
  static _getLevelColor(level) {
    switch (level) {
    case "error":
      return "\x1b[31m";
    case "warn":
      return "\x1b[33m";
    case "info":
      return "\x1b[36m";
    case "debug":
      return "\x1b[34m";
    default:
      return "\x1b[36m";
    }
  }

  /**
   * Formatter function which formats the output to the console.
   * @param {Object} args - Arguments passed by Winston.
   * @returns {String} - The formatted message.
   */
  static _consoleFormatter(args) {
    args = Logger._checkEmptyMessage(args);
    const color = Logger._getLevelColor(args.level);

    return sprintf(`\x1b[0m[%s] ${color}%5s:\x1b[0m %2s/%d: \x1b[36m%s\x1b[0m`,
      new Date().toISOString(), args.level.toUpperCase(), name,
      process.pid, args.message);
  }

  /**
   * Formatter function which formate the output to the log file.
   * @param {Object} args - Arguments passed by Winston.
   * @returns {String} - The formatted message.
   */
  static _fileFormatter(args) {
    args = Logger._checkEmptyMessage(args);
    return JSON.stringify({
      name,
      pid: process.pid,
      level: args.level,
      msg: args.message,
      time: new Date().toISOString()
    });
  }

  /**
   * Function to create a global logger object based on the properties of the Logger class.
   */
  static _createLogger() {
    if (!global.logger) global.logger = {};

    Object.keys(Logger._levels).map(level => {
      if (Logger._pretty) {
        global.logger[level] = msg => {
          if (!Logger._verbose) Logger.logger[level](msg);
        };
      } else {
        global.logger[level] = msg => {
          if (!Logger._verbose) console[level](msg);
        };
      }
    });
  }

}
