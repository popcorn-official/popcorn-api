const CronJob = require("cron").CronJob,
  fs = require("fs"),
  config = require("./config");

/* Makes the temporary directory. */
const makeTemp = () => {
  if (!fs.existsSync(config.tempDir)) {
    fs.mkdirSync(config.tempDir);
  }
};

module.exports = {

  makeTemp: makeTemp,

  /* Error logger function. */
  onError: (errorMessage) => {
    fs.appendFile(config.tempDir + "/" + config.errorLog, errorMessage + "\n");
    console.error(errorMessage);
    return new Error(errorMessage);
  },

  /* Updates the 'lastUpdated' file. */
  setlastUpdate: () => {
    fs.writeFile(config.tempDir + "/" + config.updatedFile, JSON.stringify({
      lastUpdated: Math.floor(new Date().getTime() / 1000)
    }), (err) => {});
  },

  /* Updates the 'status' file. */
  setStatus: (status) => {
    fs.writeFile(config.tempDir + "/" + config.statusFile, JSON.stringify({
      "status": status
    }), (err) => {});
  },

  /*
   * Function for resolving generators.
   * Method from: https://www.youtube.com/watch?v=lil4YCCXRYc
   */
  spawn: (generator) => {
    return new Promise((resolve, reject) => {
      let onResult = (lastPromiseResult) => {
        let {
          value,
          done
        } = generator.next(lastPromiseResult);
        if (!done) {
          value.then(onResult, reject)
        } else {
          resolve(value);
        }
      };
      onResult();
    });
  },

  /* Removes all the files in the temporary directory. */
  resetTemp: (path = config.tempDir) => {
    const files = fs.readdirSync(path);
    files.forEach((file) => {
      const stats = fs.statSync(path + "/" + file);
      if (stats.isDirectory()) {
        resetTemp(file);
      } else if (stats.isFile()) {
        fs.unlinkSync(path + "/" + file);
      }
    });
    makeTemp();
  },

  /* Initiates the cronjob. */
  initCron: (cronTime, job, doneFunction) => {
    try {
      const job = new CronJob({
        cronTime: cronTime,
        onTick: () => {
          job;
        },
        onComplete: () => {
          doneFunction;
        },
        start: true,
        timeZone: "America/Los_Angeles"
      });
      console.log("Cron job started");
    } catch (ex) {
      util.onError("Cron pattern not valid");
    }
    job;
  }

};
