// Import the neccesary modules.
import Anime from "../models/Anime";
import { pageSize } from "../config/constants";

/** Class for getting anime data from the MongoDB. */
export default class AnimeController {

  /** Create an anime controller object. */
  constructor() {
    /**
     * Object used for the projection of anime shows.
     * @type {Object}
     */
    AnimeController._projection = {
      images: 1,
      mal_id: 1,
      haru_id: 1,
      tvdb_id: 1,
      imdb_id: 1,
      slug: 1,
      title: 1,
      year: 1,
      type: 1,
      item_data: 1,
      rating: 1,
      genres: 1,
      num_seasons: 1
    };
  }

  /**
   * Get all the pages.
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @param {Function} next - The next function for Express.
   * @returns {String[]} - A list of pages which are available.
   */
  getAnimes(req, res, next) {
    return Anime.count({
      num_seasons: {
        $gt: 0
      },
      type: "show"
    }).exec().then(count => {
      const pages = Math.ceil(count / pageSize);
      const docs = [];

      for (let i = 1; i < pages + 1; i++) docs.push(`animes/${i}`);

      return res.json(docs);
    }).catch(err => next(err));
  }

  /**
   * Get one page.
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @param {Function} next - The next function for Express.
   * @returns {Anime[]} - The contents of one page.
   */
  getPage(req, res, next) {
    const page = req.params.page - 1;
    const offset = page * pageSize;

    if (req.params.page.match(/all/i)) {
      return Anime.aggregate([{
          $match: {
            num_seasons: {
              $gt: 0
            },
            type: "show"
          }
        }, {
          $project: AnimeController._projection
        }, {
          $sort: {
            title: -1
          }
        }]).exec()
        .then(docs => res.json(docs))
        .catch(err => next(err));
    } else {
      const query = {
        num_seasons: {
          $gt: 0
        },
        type: "show"
      };
      const data = req.query;

      if (!data.order) data.order = -1;

      let sort = {
        "rating.votes": parseInt(data.order, 10),
        "rating.percentage": parseInt(data.order, 10),
        "rating.watching": parseInt(data.order, 10)
      };

      if (data.keywords) {
        const words = data.keywords.split(" ");
        let regex = "^";

        for (let w in words) {
          words[w] = words[w].replace(/[^a-zA-Z0-9]/g, "");
          regex += `(?=.*\\b${RegExp.escape(words[w].toLowerCase())}\\b)`;
        }

        query.title = {
          $regex: new RegExp(`${regex}.*`),
          $options: "gi"
        };
      }

      if (data.sort) {
        if (data.sort.match(/name/i)) sort = {
          "title": (parseInt(data.order, 10) * -1)
        };
        if (data.sort.match(/rating/i)) sort = {
          "rating.percentage": parseInt(data.order, 10),
          "rating.votes": parseInt(data.order, 10)
        };
        if (data.sort.match(/year/i)) sort = {
          "year": parseInt(data.order, 10)
        };
      }

      if (data.genre && !data.genre.match(/all/i)) query.genres = data.genre;

      return Anime.aggregate([{
          $sort: sort
        }, {
          $match: query
        }, {
          $project: AnimeController._projection
        }, {
          $skip: offset
        }, {
          $limit: pageSize
        }]).exec()
        .then(docs => res.json(docs))
        .catch(err => next(err));
    }
  }

  /**
   * Get info from one anime.
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @param {Function} next - The next function for Express.
   * @returns {Anime} - The details of a single anime.
   */
  getAnime(req, res, next) {
    return Anime.findOne({
        _id: req.params.id,
        type: "show"
      }, {
        latest_episode: 0
      }).exec()
      .then(docs => res.json(docs))
      .catch(err => next(err));
  }

  /**
   * Get a random anime.
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @param {Function} next - The next function for Express.
   * @returns {Anime} - A random movie.
   */
  getRandomAnime(req, res, next) {
    return Anime.aggregate([{
        $match: {
          type: "show"
        }
      }, {
        $project: AnimeController._projection
      }, {
        $sample: {
          size: 1
        }
      }, {
        $limit: 1
      }]).exec()
      .then(docs => res.json(docs[0]))
      .catch(err => next(err));
  }

}
