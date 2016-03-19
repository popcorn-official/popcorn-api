"use strict";

const app = require("express")(),
  cluster = require("cluster"),

  cpuCount = require("os").cpus().length,
  domain = require("domain"),
  fs = require("fs"),
  config = require("./config"),
  scraper = require("./scraper"),
  util = require("./util");

require("./setup.js")(config, app);
require("./routes.js")(app);

if (cluster.isMaster) {
  for (let i = 0; i < Math.min(cpuCount, config.workers); i++) {
    cluster.fork();
  }

  util.makeTemp();
  util.setStatus("Starting up");

  cluster.on("exit", (worker, code, signal) => {
    util.onError("Worker '" + worker.process.pid + "' died, spinning up another!");
    cluster.fork();
  });

  if (config.master) {
    const scope = domain.create();
    scope.run(() => {
      util.initCron(config.scrapeTime, scraper.scrape(), util.setStatus("Idle"));
    });
    scope.on("error", (err) => {
      util.onError(err);
    });
  }
} else {
  app.listen(config.port);
}
