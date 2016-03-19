const mongoose = require("mongoose");

module.exports = mongoose.model("Movie", {
  _id: {
    type: String,
    required: true,
    index: {
      unique: true
    }
  },
  imdb_id: String,
  title: String,
  year: String,
  slug: String,
  synopsis: String,
  runtime: String,
  rating: {},
  country: String,
  last_updated: Number,
  images: {},
  genres: [],
  released: Number,
  trailer: String,
  certification: String,
  torrents: {}
});
