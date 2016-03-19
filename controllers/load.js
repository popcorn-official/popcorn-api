const fs = require("fs");

fs.readdirSync(__dirname).filter((file) => {
  return (file.indexOf(".") !== 0) && (file !== "load.js");
}).forEach((file) => {
  module.exports[file.replace(/\.js$/, "")] = require("./" + file);
});
