// Import the neccesary modules.
import asyncq from "async-q";
import katApi from "kat-api-pt";
import { global, katAnimeMap } from "../../config/constants";
import Helper from "./helper";
import Util from "../../util";

export default class KAT {

  constructor(name) {
    this.name = name;

    this.helper = new Helper(this.name);
    this.kat = new katApi();
    this.util = new Util();
  };

  /**
   * @description Get all the animes.
   * @function KAT#getAnime
   * @memberof module:providers/anime/kat
   * @param {Object} katAnime - The anime information.
   * @returns {Anime} - An anime.
   */
  async getAnime(katAnime) {
    try {
      const newAnime = await this.helper.getHummingbirdInfo(katAnime.slug);
      if (newAnime && newAnime._id) {
        const slug = katAnime.slug;

        delete katAnime.animeTitle;
        delete katAnime.slug;
        delete katAnime.torrentLink;
        delete katAnime.season;
        delete katAnime.episode;
        delete katAnime.quality;

        return await this.helper.addEpisodes(newAnime, katAnime, slug);
      }
    } catch (err) {
      return this.util.onError(err);
    }
  };

  /**
   * @description Extract anime information based on a regex.
   * @function KAT#extractAnime
   * @memberof module:providers/anime/kat
   * @param {Object} torrent - The torrent to extract the anime information from.
   * @param {Regex} regex - The regex to extract the anime information.
   * @returns {Object} - Information about a anime from the torrent.
   */
  extractAnime(torrent, regex) {
    let animeTitle = torrent.title.match(regex)[1];
    if (animeTitle.endsWith(" ")) animeTitle = animeTitle.substring(0, animeTitle.length - 1);
    animeTitle = animeTitle.replace(/\./g, " ");
    let slug = animeTitle.replace(/[!]/gi, "").replace(/\s-\s/gi, "").replace(/\s+/g, "-").toLowerCase();
    slug = slug in katAnimeMap ? katAnimeMap[slug] : slug;

    let season, episode, quality;
    if (torrent.title.match(regex).length >= 5) {
      season = parseInt(torrent.title.match(regex)[2], 10);
      episode = parseInt(torrent.title.match(regex)[3], 10);
      quality = torrent.title.match(regex)[4];
    } else {
      season = 1;
      episode = parseInt(torrent.title.match(regex)[2], 10);
      quality = torrent.title.match(regex)[3];
    }

    const episodeTorrent = {
      url: torrent.magnet,
      seed: torrent.seeds,
      peer: torrent.peers,
      provider: this.name
    };

    const anime = { animeTitle, slug, torrentLink: torrent.link, season, episode, quality };

    if (!anime[season]) anime[season] = {};
    if (!anime[season][episode]) anime[season][episode] = {};
    if (!anime[season][episode][quality] || (anime[season][episode][quality] && anime[season][episode][quality].seed < episodeTorrent.seed))
      anime[season][episode][quality] = episodeTorrent;

    return anime;
  };

  /**
   * @description Get anime info from a given torrent.
   * @function KAT#getAnimeData
   * @memberof module:providers/anime/kat
   * @param {Object} torrent - A torrent object to extract anime information
   * from.
   * @returns {Object} - Information about an anime from the torrent.
   */
  getAnimeData(torrent) {
    const secondSeason = /\[horriblesubs\].(.*).S(\d)...(\d{2,3}).\[(\d{3,4}p)\]/i;
    if (torrent.title.match(secondSeason)) {
      return this.extractAnime(torrent, secondSeason);
    } else {
      console.warn(`${this.name}: Could not find data from torrent: '${torrent.title}'`);
    }
  };

  /**
   * @description Puts all the found animes from the torrents in an array.
   * @function KAT#getAllKATAnimes
   * @memberof module:providers/anime/kat
   * @param {Array} torrents - A list of torrents to extract anime information.
   * @returns {Array} - A list of objects with anime information extracted from
   * the torrents.
   */
  async getAllKATAnimes(torrents) {
    try {
      const animes = [];
      await asyncq.mapSeries(torrents, torrent => {
        if (torrent) {
          const anime = this.getAnimeData(torrent);
          if (anime) {
            if (animes.length != 0) {
              const { animeTitle, slug, season, episode, quality } = anime;
              const matching = animes
                .filter(a => a.animeTitle === animeTitle)
                .filter(a => a.slug === slug);

              if (matching.length != 0) {
                const index = animes.indexOf(matching[0]);
                if (!matching[0][season]) matching[0][season] = {};
                if (!matching[0][season][episode]) matching[0][season][episode] = {};
                if (!matching[0][season][episode][quality] || (matching[0][season][episode][quality] && matching[0][season][episode][quality].seed < anime[season][episode][quality].seed))
                  matching[0][season][episode][quality] = anime[season][episode][quality];

                animes.splice(index, 1, matching[0]);
              } else {
                animes.push(anime);
              }
            } else {
              animes.push(anime);
            }
          }
        }
      });
      return animes;
    } catch (err) {
      return this.util.onError(err);
    }
  };

  /**
   * @description Get all the torrents of a given provider.
   * @function KAT#getAllTorrents
   * @memberof module:providers/anime/kat
   * @param {Integer} totalPages - The total pages of the query.
   * @param {Object} provider - The provider to query {@link https://kat.cr/}.
   * @returns {Array} - A list of all the queried torrents.
   */
  async getAllTorrents(totalPages, provider) {
    try {
      let katTorrents = [];
      await asyncq.timesSeries(totalPages, async page => {
        try {
          provider.query.page = page + 1;
          console.log(`${this.name}: Starting searching KAT on page ${provider.query.page} out of ${totalPages}`);
          const result = await this.kat.search(provider.query);
          katTorrents = katTorrents.concat(result.results);
        } catch (err) {
          return this.util.onError(err);
        }
      });
      console.log(`${this.name}: Found ${katTorrents.length} torrents.`);
      return katTorrents;
    } catch (err) {
      return this.util.onError(err);
    }
  };

  /**
   * @description Returns a list of all the inserted torrents.
   * @function KAT#search
   * @memberof module:providers/anime/kat
   * @param {Object} provider - The provider to query {@link https://kat.cr/}.
   * @returns {Array} - A list of scraped animes.
   */
  async search(provider) {
    try {
      console.log(`${this.name}: Starting scraping...`);
      provider.query.page = 1;
      provider.query.category = "english-translated";
      provider.query.verified = 1;
      provider.query.adult_filter = 1;

      const getTotalPages = await this.kat.search(provider.query);
      const totalPages = getTotalPages.totalPages; // Change to 'const' for production.
      if (!totalPages) return this.util.onError(`${this.name}: totalPages returned: '${totalPages}'`);
      // totalPages = 3; // For testing purposes only.
      console.log(`${this.name}: Total pages ${totalPages}`);

      const katTorrents = await this.getAllTorrents(totalPages, provider);
      const katAnimes = await this.getAllKATAnimes(katTorrents);
      return await asyncq.mapLimit(katAnimes, global.maxWebRequest,
        katAnime => this.getAnime(katAnime).catch(err => this.util.onError(err)));
    } catch (err) {
      this.util.onError(err);
    }
  };

};
