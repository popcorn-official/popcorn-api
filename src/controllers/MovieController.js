// Import the neccesary modules.
import Movie from "../models/Movie";
import { pageSize } from "../config/constants";

/** Class for getting movie data from the MongoDB. */
export default class MovieController {

  /** Create a movie controller object. */
  constructor() {
    /**
     * Object used for the projection of movies.
     * @type {Object}
     */
    MovieController._projection = {
      _id: 1,
      imdb_id: 1,
      title: 1,
      year: 1,
      runtime: 1,
      images: 1,
      genres: 1,
      synopsis: 1,
      trailer: 1,
      certification: 1,
      released: 1,
      rating: 1,
      torrents: 1
    };
  }

  /**
   * Get all the pages.
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @param {Function} next - The next function for Express.
   * @returns {String[]} - A list of pages which are available.
   */
  getMovies(req, res, next) {
    return Movie.count().exec().then(count => {
      const pages = Math.ceil(count / pageSize);
      const docs = [];

      for (let i = 1; i < pages + 1; i++) docs.push(`movies/${i}`);

      return res.json(docs);
    }).catch(err => next(err));
  }

  /**
   * Get one page.
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @param {Function} next - The next function for Express.
   * @returns {Movie[]} - The contents of one page.
   */
  getPage(req, res, next) {
    const page = req.params.page - 1;
    const offset = page * pageSize;

    if (req.params.page.match(/all/i)) {
      return Movie.aggregate([{
          $project: MovieController._projection
        }, {
          $sort: {
            title: -1
          }
        }]).exec()
        .then(docs => res.json(docs))
        .catch(err => next(err));
    } else {
      const query = {};
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
        if (data.sort.match(/last added/i)) sort = {
          "released": parseInt(data.order, 10)
        };
        if (data.sort.match(/rating/i)) sort = {
          "rating.percentage": parseInt(data.order, 10),
          "rating.votes": parseInt(data.order, 10)
        };
        if (data.sort.match(/title/i)) sort = {
          "title": (parseInt(data.order, 10) * 1)
        };
        if (data.sort.match(/trending/i)) sort = {
          "rating.watching": parseInt(data.order, 10)
        };
        if (data.sort.match(/year/i)) sort = {
          "year": parseInt(data.order, 10)
        };
      }

      if (data.genre && !data.genre.match(/all/i)) {
        if (data.genre.match(/science[-\s]fiction/i) || data.genre.match(/sci[-\s]fi/i)) data.genre = "science-fiction";
        query.genres = data.genre.toLowerCase();
      }

      return Movie.aggregate([{
          $sort: sort
        }, {
          $match: query
        }, {
          $project: MovieController._projection
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
   * Get info from one movie.
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @param {Function} next - The next function for Express.
   * @returns {Movie} - The details of a single movie.
   */
  getMovie(req, res, next) {
    return Movie.aggregate([{
        $match: {
          _id: req.params.id
        }
      }, {
        $project: MovieController._projection
      }, {
        $limit: 1
      }]).exec()
      .then(docs => res.json(docs[0]))
      .catch(err => next(err));
  }

  /**
   * Get a random movie.
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @param {Function} next - The next function for Express.
   * @returns {Movie} - A random movie.
   */
  getRandomMovie(req, res, next) {
    return Movie.aggregate([{
        $project: MovieController._projection
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
