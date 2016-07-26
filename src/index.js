// Import the neccesary modules.
import cluster from "cluster";
import cron from "cron";
import domain from "domain";
import express from "express";
import os from "os";
import { global } from "./config/constants";
import Logger from "./config/logger";
import Routes from "./config/routes";
import Scraper from "./scraper";
import Setup from "./config/setup";
import Util from "./util";

/**
 * @class
 * @classdesc The factory function for starting the API.
 * @memberof module:global/index
 * @property {Object} util - The util object with general functions.
 */
export default class Index {

  constructor() {
    Index.util = new Util();
  };

  /**
   * @description function to start the API.
   * @function Index#startAPI
   * @memberof module:global/index
   * @param {Boolean} [startScraping=true] - Start the scraping (Default `true`).
   */
  startAPI(startScraping = true) {

    // Create a new logger class.
    const logger = new Logger();

    // Make an ExpressJS application.
    const app = express();

    // Setup the MongoDB configuration and ExpressJS configuration.
    Setup.setup(app, logger);

    // Setup the API routes.
    new Routes().routes(app);

    if (cluster.isMaster) { // Check is the cluster is the master
      // Override the console object with Winston.
      const winston = logger.getLogger();
      logger.overrideConsole(winston);

      // Clear the log files from the temp directory.
      logger.reset();

      // Setup the temporary directory
      Index.util.createTemp();

      // Fork workers.
      for (let i = 0; i < Math.min(os.cpus().length, global.workers); i++) {
        cluster.fork();
      }

      // Check for errors with the workers.
      cluster.on("exit", worker => {
        Index.util.onError(`Worker '${worker.process.pid}' died, spinning up another!`);
        cluster.fork();
      });

      // Start the cronjob.
      if (global.master) {
        const scraper = new Scraper();
        const scope = domain.create();
        scope.run(() => {
          console.log("API started");
          try {
            new cron.CronJob({
              cronTime: global.scrapeTime,
              onTick: () => scraper.scrape(),
              onComplete: () => Index.util.setStatus(),
              start: true,
              timeZone: "America/Los_Angeles"
            });
            Index.util.setLastUpdated("Never");
            Index.util.setStatus();
            if (startScraping) scraper.scrape();
          } catch (ex) {
            return Index.util.onError(ex);
          }
        });
        scope.on("error", err => Index.util.onError(err));
      }
    } else {
      app.listen(global.port);
    }
  };

};
