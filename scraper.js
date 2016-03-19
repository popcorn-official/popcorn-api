const async = require("async-q"),
  config = require("./config"),
  eztv = require("./providers/show/eztv")("EZTV"),
  katMovie = require("./providers/movie/kat"),
  katShow = require("./providers/show/kat"),
  util = require("./util");

/* Start movie scraping from KAT. */
const scrapeKatMovies = () => {
  return async.eachSeries(config.movieProviders, (provider) => {
    util.setStatus("Scraping " + provider.name);
    const katProvider = katMovie(provider.name);
    return util.spawn(katProvider.search(provider)).then((response) => {
      console.log(provider.name + ": Done.");
      return response;
    });
  });
};

/* Start show scraping from KAT. */
const scrapeKATShows = () => {
  return async.eachSeries(config.showProviders, (provider) => {
    util.setStatus("Scraping " + provider.name);
    const katProvider = katShow(provider.name);
    return util.spawn(katProvider.search(provider)).then((response) => {
      console.log(provider.name + ": Done.");
      return response;
    });
  });
};

/* Start scraping from EZTV. */
const scrapeEZTV = () => {
  util.setStatus("Scraping " + eztv.name);
  return util.spawn(eztv.search()).then((response) => {
    console.log(eztv.name + ": Done.");
    return response;
  });
};

module.exports = {

  /* Initiate the scraping. */
  scrape: () => {
    util.resetTemp();
    util.setlastUpdate();

    async.eachSeries([scrapeEZTV, scrapeKATShows, scrapeKatMovies], (scraper) => {
      return scraper();
    }).catch((err) => {
      util.onError("Error while scraping: " + err);
      console.log(err);
      return err;
    }).done();
  }

};
