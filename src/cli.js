// Import the neccesary modules.
import bytes from "bytes";
import parseTorrent from "parse-torrent";
import program from "commander";
import prompt from "prompt";
import torrentHealth from "torrent-tracker-health";
import Index from "./index";
import MovieHelper from "./providers/movie/helper";
import packageJSON from "../package.json";
import Setup from "./config/setup";
import ShowHelper from "./providers/show/helper";
import Util from "./util";

/**
 * @class
 * @classdesc The factory function for the command line interface.
 * @memberof module:global/cli
 * @property {Function} index - The index object to start the API.
 * @property {Function} setup - The setup object to make a connection to MongoDB.
 * @property {Function} util - The util object with general functions.
 * @property {Object} packageJSON - The package.json file in JSON format.
 * @param {String} [providerName=CLI] - The default provider name.
 *
 */
export default class CLI {

  constructor(providerName = "CLI") {
    this.index = new Index();
    this.util = new Util();

    // Setup the CLI program.
    program
      .version(`${packageJSON.name} v${packageJSON.version}`)
      .option("-c, --content <type>", "Add content from the MongoDB database (show | movie).", /^(show)|^(movie)/i, false)
      .option("-r, --run", "Run the API and start the scraping process.")
      .option("-s, --server", "Run the API without starting the scraping process.");

    // Extra output on top of the default help output
    program.on("--help", () => {
      console.log("  Examples:");
      console.log("");
      console.log("    $ popcorn-api -c <movie|show>");
      console.log("    $ popcorn-api --content <movie|show>");
      console.log("");
      console.log("    $ popcorn-api -r");
      console.log("    $ popcorn-api --run");
      console.log("");
      console.log("    $ popcorn-api -s");
      console.log("    $ popcorn-api --server");
      console.log("");
    });

    // Parse the command line arguments.
    program.parse(process.argv);

    // The imdb property.
    const imdb = {
      description: "The imdb id of the show/movie to add (tt1234567)",
      type: "string",
      pattern: /^(tt\d{7})/i,
      message: "Not a valid imdb id.",
      required: true
    };

    // The torrent property.
    const torrent = {
      description: "The link of the torrent to add",
      type: "string",
      message: "Not a valid torrent.",
      required: true
    };

    // The language property.
    const language = {
      description: "The language of the torrent to add (en, fr, jp)",
      type: "string",
      pattern: /^([a-zA-Z]{2})/i,
      message: "Not a valid language",
      required: true
    }

    // The quality property.
    const quality = {
      description: "The quality of the torrent (480p | 720p | 1080p)",
      type: "string",
      pattern: /^(480p|720p|1080p)/i,
      message: "Not a valid quality.",
      required: true
    };

    // The season property.
    const season = {
      description: "The season number of the torrent",
      type: "integer",
      pattern: /^(\d+)/i,
      message: "Not a valid season.",
      required: true
    };

    // The episode property.
    const episode = {
      description: "The episode number of the torrent",
      type: "integer",
      pattern: /^(\d+)/i,
      message: "Not a valid episode.",
      required: true
    };

    // The shema used by `prompt` insert a movie.
    this.movieSchema = {
      properties: {
        "imdb": imdb,
        "language": language,
        "torrent": torrent,
        "quality": quality
      }
    };

    // The shema used by `prompt` insert a show.
    this.showSchema = {
      properties: {
        "imdb": imdb,
        "season": season,
        "episode": episode,
        "torrent": torrent,
        "quality": quality
      }
    };
  };

  /**
   * @description Get movie data from a given torrent url.
   * @function CLI#getMovieTorrentDataRemote
   * @memberof module:global/cli
   * @param {String} torrent - The url of the torrent.
   * @param {String} language - The language of the torrent.
   * @param {String} quality - The quality of the torrent.
   * @returns {Promise} - Movie data from the torrent.
   */
  getMovieTorrentDataRemote(torrent, language, quality) {
    return new Promise((resolve, reject) => {
      parseTorrent.remote(torrent, (err, result) => {
        if (err) return reject(err);

        const magnet = parseTorrent.toMagnetURI(result);
        torrentHealth(magnet).then(res => {
          const { seeds, peers } = res;
          const data = {};
          if (!data[language]) data[language] = {};
          if (!data[language][quality]) data[language][quality] = {
            url: magnet,
            seed: seeds,
            peer: peers,
            size: result.length,
            filesize: bytes(result.length),
            provider: providerName
          };
          return resolve(data);
        }).catch(err => reject(err));
      });
    });
  };

  /**
   * @description Adds a movie to the database through the CLI.
   * @function CLI#moviePrompt
   * @memberof module:global/cli
   */
  moviePrompt() {
    prompt.get(this.movieSchema, async(err, result) => {
      if (err) {
        util.onError(`An error occurred: ${err}`);
        process.exit(1);
      } else {
        try {
          const { imdb, quality, language, torrent } = result;
          const movieHelper = new MovieHelper(providerName);
          const newMovie = await movieHelper.getTraktInfo(imdb);
          if (newMovie && newMovie._id) {
            const data = await getMovieTorrentDataRemote(torrent, language, quality);
            await movieHelper.addTorrents(newMovie, data);
            process.exit(0);
          }
        } catch (err) {
          this.util.onError(`An error occurred: ${err}`);
          process.exit(1);
        }
      }
    });
  };

  /**
   * @description Get show data from a given torrent url.
   * @function CLI#getShowTorrentDataRemote
   * @memberof module:global/cli
   * @param {String} torrent - The url of the torrent.
   * @param {String} quality - The quality of the torrent.
   * @param {Integer} season - The season of the show from the torrent file.
   * @param {Integer} episode - The episode of the show from the torrent.
   * @returns {Promise} - Show data from the torrent.
   */
  getShowTorrentDataRemote(torrent, quality, season, episode) {
    return new Promise((resolve, reject) => {
      parseTorrent.remote(torrent, (err, result) => {
        if (err) return reject(err);

        const magnet = parseTorrent.toMagnetURI(result);
        torrentHealth(magnet).then(res => {
          const { seeds, peers } = res;
          const data = {};
          if (!data[season]) data[season] = {};
          if (!data[season][episode]) data[season][episode] = {};
          if (!data[season][episode][quality]) data[season][episode][quality] = {
            url: magnet,
            seeds,
            peers,
            provider: providerName
          };
          return resolve(data);
        }).catch(err => reject(err));
      });
    });
  };

  /**
   * @description Adds a show to the database through the CLI.
   * @function CLI#showPrompt
   * @memberof module:global/cli
   */
  showPrompt() {
    prompt.get(this.showSchema, async(err, result) => {
      if (err) {
        util.onError(`An error occurred: ${err}`);
        process.exit(1);
      } else {
        try {
          const { imdb, season, episode, quality, torrent } = result;
          const showHelper = new ShowHelper(providerName);
          const newShow = await showHelper.getTraktInfo(imdb);
          if (newShow && newShow._id) {
            const data = await getShowTorrentDataRemote(torrent, quality, season, episode);
            await showHelper.addEpisodes(newShow, data, imdb);
            process.exit(0);
          }
        } catch (err) {
          this.util.onError(`An error occurred: ${err}`);
          process.exit(1);
        }
      }
    });
  };

  /**
   * @description Run the CLI program.
   * @function CLI#run
   * @memberof module:global/cli
   */
  run() {
    if (program.run) {
      this.index.startAPI(true);
    } else if (program.server) {
      this.index.startAPI(false);
    } else if (program.content) {
      prompt.start();
      Setup.connectMongoDB();

      if (program.content.match(/^(show)/i)) {
        this.showPrompt();
      } else if (program.content.match(/^(movie)/i)) {
        this.moviePrompt();
      }
    } else {
      this.util.onError("\n  \x1b[31mError:\x1b[36m No valid command given. Please check below:\x1b[0m");
      program.help();
    }
  };

};
