const bodyParser = require("body-parser"),
  compress = require("compression"),
  express = require("express"),
  join = require("path").join,
  logger = require("morgan"),
  responseTime = require("response-time"),
  config = require("./config");

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

RegExp.escape = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

mongoose.connect("mongodb://" + config.dbHosts.join(",") + "/popcorn_shows", {
  db: {
    native_parser: true
  },
  replset: {
    rs_name: "pt0",
    connectWithNoPrimary: true,
    readPreference: "nearest",
    strategy: "ping",
    socketOptions: {
      keepAlive: 1
    }
  },
  server: {
    readPreference: "nearest",
    strategy: "ping",
    socketOptions: {
      keepAlive: 1
    }
  }
});

module.exports = (config, app) => {
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(bodyParser.json());
  app.use(compress({
    threshold: 1400,
    level: 4,
    memLevel: 3
  }));
  app.use(responseTime());
  app.use(logger("short"));
};
