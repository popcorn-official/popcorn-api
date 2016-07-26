// Import the neccesary modules.
import mongoose from "mongoose";

// The anime schema used by mongoose.
const AnimeSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    index: {
      unique: true
    }
  },
  mal_id: String,
  title: String,
  year: String,
  slug: String,
  synopsis: String,
  runtime: String,
  status: String,
  rating: {
    percentage: Number,
    watching: Number,
    votes: Number,
    loved: Number,
    hated: Number
  },
  type: String,
  num_episodes: Number,
  last_updated: Number,
  latest_episode: {type: Number, default: 0},
  images: {
    banner: String,
    fanart: String,
    poster: String
  },
  genres: [],
  episodes: []
});




/**
 * @class Anime
 * @classdesc A model object for animes.
 * @memberof module:models/anime
 */
const Anime = mongoose.model("Anime", AnimeSchema);

// Export the user model.
export default Anime;
