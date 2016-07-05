// Import the neccesary modules.
import { global } from "../config/global";
import Show from "../models/Show";

/**
 * @class
 * @classdesc The factory function for getting show data from the MongoDB.
 * @memberof module:controllers/shows
 * @property {Object} projection - Object used for the projection of shows.
 */
const Shows = () => {

  const projection = {
    _id: 1,
    imdb_id: 1,
    tvdb_id: 1,
    title: 1,
    year: 1,
    images: 1,
    slug: 1,
    num_seasons: 1,
    rating: 1
  };

  /**
   * @description Get all the pages.
   * @function Shows#getShows
   * @memberof module:controllers/shows
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @returns {Array} - A list of pages which are available.
   */
  const getShows = (req, res) => {
    return Show.count({
      num_seasons: {
        $gt: 0
      }
    }).exec().then(count => {
      const pages = Math.round(count / global.pageSize);
      const docs = [];

      for (let i = 1; i < pages + 1; i++)
        docs.push(`shows/${i}`);

      return res.json(docs);
    }).catch(err => res.json(err));
  };

  /**
   * @description Get one page.
   * @function Shows#getPage
   * @memberof module:controllers/shows
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @returns {Array} - The contents of one page.
   */
  const getPage = (req, res) => {
    const page = req.params.page - 1;
    const offset = page * global.pageSize;

    if (req.params.page === "all") {
      return Show.aggregate([{
          $match: {
            num_seasons: {
              $gt: 0
            }
          }
        }, {
          $project: projection
        }, {
          $sort: {
            title: -1
          }
        }]).exec()
        .then(docs => res.json(docs))
        .catch(err => res.json(err));
    } else {
      let query = {};
      query.num_seasons = {
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
        if (data.sort === "trending") sort = {
          "rating.watching": parseInt(data.order, 10)
        };
        if (data.sort === "updated") sort = {
          "latest_episode": parseInt(data.order, 10)
        };
        if (data.sort === "year") sort = {
          "year": parseInt(data.order, 10)
        };
      }

      if (data.genre && data.genre !== "All") {
        if (data.genre.match(/science[-\s]fiction/i) || data.genre.match(/sci[-\s]fi/i)) data.genre = "science-fiction";
        query.genres = data.genre.toLowerCase();
      }

      return Show.aggregate([{
          $sort: sort
        }, {
          $match: query
        }, {
          $project: projection
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
   * @description Get info from one show.
   * @function Shows#getShow
   * @memberof module:controllers/shows
   * @param {Request} req - The express request object.
   * @param {Response} res - The express response object.
   * @returns {Show} - The details of a single show.
   */
  const getShow = (req, res) => {
    return Show.findOne({
      _id: req.params.id
    }).exec()
    .then(docs => res.json(docs))
    .catch(err => res.json(err));
  };

  // Return the public functions.
  return { getShows, getPage, getShow };

};

// Export the shows factory function.
export default Shows;
