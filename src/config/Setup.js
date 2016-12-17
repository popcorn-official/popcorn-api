// Import the neccesary modules.
import bodyParser from "body-parser";
import compress from "compression";
import mongoose from "mongoose";
import responseTime from "response-time";

import Logger from "./Logger";
import { dbHosts, dbName, Promise } from "./constants";

/** Class for setting up the API. */
export default class Setup {

  /**
   * Setup the Express service.
   * @param {Express} app - The ExpresssJS instance.
   * @param {?Boolean} [pretty] - Pretty output with Winston logging.
   * @param {?Boolean} [verbose] - Debug mode for no output.
   */
  constructor(app, pretty, verbose) {
    // Used to extract data from query strings.
    RegExp.escape = text => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

    // Connection and configuration of the MongoDB database.
    Setup.connectMongoDB();

    // Enable parsing URL encoded bodies.
    app.use(bodyParser.urlencoded({extended: true}));

    // Enable parsing JSON bodies.
    app.use(bodyParser.json());

    // Enables compression of response bodies.
    app.use(compress({
      threshold: 1400,
      level: 4,
      memLevel: 3
    }));

    // Enable response time tracking for HTTP request.
    app.use(responseTime());

    // Enable HTTP request logging.
    if (pretty && !verbose) app.use(Logger.expressLogger);
  }

  /** Connection and configuration of the MongoDB database. */
  static connectMongoDB() {
    mongoose.Promise = Promise;
    mongoose.connect(`mongodb://${dbHosts.join(",")}/${dbName}`, {
      db: {
        native_parser: true
      },
      replset: {
        rs_name: "pt0",
        connectWithNoPrimary: true,
        readPreference: "nearest",
        strategy: "ping",
        socketOptions: {
          keepAlive: 1
        }
      },
      server: {
        readPreference: "nearest",
        strategy: "ping",
        socketOptions: {
          keepAlive: 1
        }
      }
    });
  }

}
