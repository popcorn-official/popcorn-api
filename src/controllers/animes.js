// Import the neccesary modules.
import { global } from "../config/constants";
import Anime from "../models/Anime";

/**
 * @class
 * @classdesc The factory function for getting anime data from the MongoDB.
 * @memberof module:controllers/animes
 */
export default class Animes {

  constructor() {
    Animes.projection = {
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
      rating: 1
    };
  };

  /**
   * @description Get all the pages.
   * @function Animes#getAnimes
   * @memberof module:controllers/animes
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @returns {Array} - A list of pages which are available.
   */
  getAnimes(req, res) {
    return Anime.count({
      num_episodes: {
        $gt: 0
      }
    }).exec().then(count => {
      const pages = Math.round(count / global.pageSize);
      const docs = [];

      for (let i = 1; i < pages + 1; i++) docs.push(`anime/${i}`);

      return res.json(docs);
    }).catch(err => res.json(err));
  };

  /**
   * @description Get one page.
   * @function Animes#getPage
   * @memberof module:controllers/animes
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @returns {Array} - The contents of one page.
   */
  getPage(req, res) {
    const page = req.params.page - 1;
    const offset = page * global.pageSize;

    if (req.params.page === "all") {
      return Anime.aggregate([{
          $match: {
            num_episodes: {
              $gt: 0
            }
          }
        }, {
          $project: Animes.projection
        }, {
          $sort: {
            title: -1
          }
        }]).exec()
        .then(docs => res.json(docs))
        .catch(err => res.json(err));
    } else {
      let query = {};
      query.num_episodes = {
        $gt: 0
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
          regex += `(?=.*\\b${RegExp.escape(words[w].toLowerCase())}\\b)`;
        }

        query.title = { $regex: new RegExp(`${regex}.*`), $options: "gi" };
      }

      if (data.sort) {
        if (data.sort === "name") sort = {
          "title": (parseInt(data.order, 10) * -1)
        };
        if (data.sort === "rating") sort = {
          "rating.percentage": parseInt(data.order, 10),
          "rating.votes": parseInt(data.order, 10)
        };
        // if (data.sort === "trending") sort = {
        //   "rating.watching": parseInt(data.order, 10)
        // };
        // if (data.sort === "updated") sort = {
        //   "latest_episode": parseInt(data.order, 10)
        // };
        if (data.sort === "year") sort = {
          "year": parseInt(data.order, 10)
        };
      }

      if (data.genre && data.genre !== "All") {
        if (data.genre.match(/science[-\s]fiction/i) || data.genre.match(/sci[-\s]fi/i)) data.genre = "science-fiction";
        query.genres = data.genre.toLowerCase();
      }

      return Anime.aggregate([{
          $sort: sort
        }, {
          $match: query
        }, {
          $project: Animes.projection
        }, {
          $skip: offset
        }, {
          $limit: global.pageSize
        }]).exec()
        .then(docs => res.json(docs))
        .catch(err => res.json(err));
    }
  };

  /**
   * @description Get info from one anime.
   * @function Animes#getAnime
   * @memberof module:controllers/animes
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @returns {Anime} - The details of a single anime.
   */
  getAnime(req, res) {
    return Anime.findOne({
      _id: req.params.id
    }, {latest_episode: 0}).exec()
    .then(docs => res.json(docs))
    .catch(err => res.json(err));
  };

  /**
   * @description Get a random anime.
   * @function Movies#getRandomAnime
   * @memberof module:controllers/anime
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @returns {Anime} - A random movie.
   */
  getRandomAnime(req, res) {
    return Anime.aggregate([{
        $project: Animes.projection
      }, {
        $sample: {
          size: 1
        }
      }, {
        $limit: 1
      }]).exec()
      .then(docs => res.json(docs[0]))
      .catch(err => res.json(err));
  };

};
