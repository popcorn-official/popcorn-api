const config = require("../config.js"),
  Movie = require("../models/Movie"),
  util = require("../util");

const projection = {
  _id: 1,
  imdb_id: 1,
  title: 1,
  year: 1,
  images: 1,
  slug: 1,
  released: 1,
  rating: 1
};

module.exports = {

  /* Get all the pages. */
  getMovies: (req, res) => {
    return Movie.count({}).exec().then((count) => {
      const pages = Math.round(count / config.pageSize);
      const docs = [];

      for (let i = 1; i < pages + 1; i++)
        docs.push("movies/" + i);

      return res.json(docs);
    }).catch((err) => {
      util.onError(err);
      return res.json(err);
    });
  },

  /* Get one page. */
  getPage: (req, res) => {
    const page = req.params.page - 1;
    const offset = page * config.pageSize;

    if (req.params.page === "all") {
      return Movie.aggregate([{
        $project: projection
      }, {
        $sort: {
          title: -1
        }
      }]).exec().then((docs) => {
        return res.json(docs);
      }).catch((err) => {
        util.onError(err);
        return res.json(err);
      });
    } else {
      let query = {};
      const data = req.query;

      if (!data.order)
        data.order = -1;

      let sort = {
        "rating.votes": parseInt(data.order, 10),
        "rating.percentage": parseInt(data.order, 10),
        "rating.watching": parseInt(data.order, 10)
      };

      if (data.keywords) {
        const words = data.keywords.split(" ");
        let regex = data.keywords.toLowerCase();
        if (words.length > 1) {
          regex = "^";
          for (let w in words) {
            regex += "(?=.*\\b" + RegExp.escape(words[w].toLowerCase()) + "\\b)";
          }
          regex += ".+";
        }
        query.title = new RegExp(regex, "gi");
      }

      if (data.sort) {
        if (data.sort === "year") sort = {
          "year": parseInt(data.order, 10)
        };
        if (data.sort === "updated") sort = {
          "released": parseInt(data.order, 10)
        };
        if (data.sort === "name") sort = {
          "title": (parseInt(data.order, 10) * -1)
        };
        if (data.sort == "rating") sort = {
          "rating.percentage": parseInt(data.order, 10)
        };
        if (data.sort == "trending") sort = {
          "rating.watching": parseInt(data.order, 10)
        };
      }

      if (data.genre && data.genre != "All") {
        query.genres = data.genre.toLowerCase();
      }

      return Movie.aggregate([{
        $sort: sort
      }, {
        $match: query
      }, {
        $project: projection
      }, {
        $skip: offset
      }, {
        $limit: config.pageSize
      }]).exec().then((docs) => {
        return res.json(docs);
      }).catch((err) => {
        util.onError(err);
        return res.json(err);
      });
    }
  },

  /* Get info from one show. */
  getMovie: (req, res) => {
    return Movie.findOne({
      _id: req.params.id
    }).exec().then((docs) => {
      return res.json(docs);
    }).catch((err) => {
      util.onError(err);
      return res.json(err);
    });
  }

};
