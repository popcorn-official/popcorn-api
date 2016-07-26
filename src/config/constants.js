import path from "path";

const global = {
  master: true,
  port: 5000,
  workers: 2,
  scrapeTime: "0 0 */6 * * *",
  pageSize: 50,
  serverName: "serv01",
  tempDir: path.join(process.cwd(), "tmp"),
  statusFile: "status.json",
  updatedFile: "lastUpdated.json",
  dbHosts: ["localhost"],
  maxWebRequest: 2,
  webRequestTimeout: 2,
  traktKey: "70c43f8f4c0de74a33ac1e66b6067f11d14ad13e33cd4ebd08860ba8be014907",
  Promise
};

const katAnimeMap = {
  "kabaneri-of-the-iron-fortress": "koutetsujou-no-kabaneri",
  "luck-&-logic": "luck-logic",
  "naruto-shippuuden": "naruto-shippuden",
  "norn9norn+nonet": "norn9-norn-nonet",
  "sailor-moon-crystal": "bishoujo-senshi-sailor-moon-crystal",
  "yuruyuri": "yuru-yuri"
};

const katShowMap = {
  "60-minutes-us": "60-minutes",
  "american-crime": "american-crime-1969",
  "bachelor-live": "the-bachelor-live",
  "ballers-2015": "ballers",
  "big-brother-us": "big-brother-2000",
  "blackish": "black-ish",
  "bobs-burgers": "bob-s-burgers",
  "bordertown-2015": "bordertown-2016",
  "celebrity-big-brother": "celebrity-big-brother-2001",
  "chicago-pd": "chicago-p-d",
  "childrens-hospital-us": "childrens-hospital",
  "cooper-barretts-guide-to-surviving-life": "cooper-barrett-s-guide-to-surviving-life-2016",
  "cosmos-a-space-time-odyssey": "cosmos-a-spacetime-odyssey",
  "dcs-legends-of-tomorrow": "dc-s-legends-of-tomorrow",
  "doll-and-em": "doll-em",
  "gold-rush": "gold-rush-2010",
  "greys-anatomy": "grey-s-anatomy",
  "hawaii-five-0-2010": "hawaii-five-0",
  "heartland-ca": "heartland-2007-ca",
  "hells-kitchen-us": "hell-s-kitchen-2005",
  "house-of-cards-2013": "house-of-cards",
  "how-its-made-dream-cars": "how-it-s-made-dream-cars",
  "how-its-made": "how-it-s-made",
  "intelligence-us": "intelligence-2014",
  "its-always-sunny-in-philadelphia": "it-s-always-sunny-in-philadelphia",
  "james-mays-cars-of-the-people": "james-may-s-cars-of-the-people",
  "jericho-2016": "jericho-1969",
  "kitchen-nightmares-us": "kitchen-nightmares",
  "last-man-standing-us": "last-man-standing-2011",
  "law-and-order-svu": "law-order-special-victims-unit",
  "marvels-agent-carter": "marvel-s-agent-carter",
  "marvels-agents-of-s-h-i-e-l-d": "marvel-s-agents-of-s-h-i-e-l-d",
  "marvels-daredevil": "marvel-s-daredevil",
  "marvels-jessica-jones": "marvel-s-jessica-jones",
  "mike-and-molly": "mike-molly",
  "perception": "perception-2012",
  "power-2014": "power",
  "prey-uk": "prey-2014",
  "proof-us": "proof",
  "reckless": "reckless-2014",
  "resurrection-us": "resurrection-2014",
  "revolution-2012": "revolution",
  "rush-us": "rush-2014",
  "sanctuary-us": "sanctuary",
  "satisfaction-us": "satisfaction-2014",
  "scandal-us": "scandal",
  "schitts-creek": "schitt-s-creek",
  "second-chance": "second-chance-2016",
  "stan-lees-lucky-man": "stan-lee-s-lucky-man",
  "survivors-remorse": "survivor-s-remorse",
  "teen-wolf": "teen-wolf-2011",
  "the-bridge-us": "the-bridge-2013",
  "the-comedians-us": "the-comedians-2015",
  "the-kennedys-uk": "the-kennedys-2015",
  "the-league": "the-league-2009",
  "the-librarians-us": "the-librarians-2014",
  "the-magicians-us": "the-magicians",
  "this-is-england-90": "this-is-england-90-2015",
  "whose-line-is-it-anyway-us": "whose-line-is-it-anyway-1998",
  "young-and-hungry": "young-hungry",
  "youre-the-worst-2014": "you-re-the-worst",
  "youre-the-worst": "you-re-the-worst"
};

const movieProviders = [
  // English providers
  {name: "Megaradon", query: {query: "x264 720p | 1080p", uploader: "megaradon", language: "en"}},
  {name: "Z0n321", query: {query: "x264 720p | 1080p", uploader: "z0n321", language: "en"}},

  // French providers
  {name: "French", query: {query: "720p | 1080p", language: "fr"}},
  // German providers
  {name: "German", query: {query: "720p | 1080p", language: "de"}},
  // Spanish providers
  {name: "Spanish", query: {query: "720p | 1080p", language: "es"}},
  // Ductch providers
  {name: "Dutch", query: {query: "720p | 1080p", language: "nl"}}
];

const showProviders = [
  // 720p and 1080p providers
  {name: "Zoner720p", query: {query: "x264 720p", uploader: "z0n321"}},
  {name: "Zoner1080p", query: {query: "x264 1080p", uploader: "z0n321"}},
  {name: "Brasse0", query: {query: "x264", uploader: "brasse0"}},
  {name: "ETHD", query: {query: "x264", uploader: "ethd"}},

  // Uploader providers
  {name: "ETTV", query: {query: "x264", uploader: "ettv"}},
  {name: "KAT_EZTV", query: {query: "x264", uploader: "eztv"}},
  {name: "VTV", query: {query: "x264", uploader: "vtv"}},
  {name: "SRIGGA", query: {query: "x264", uploader: "ethd"}},

  // Zoner providers
  {name: "ZonerSD", query: {query: "x264 LOL | FLEET | KILLERS | W4F", uploader: "z0n321"}}
];

const animeProviders = [
  
];

/**
 * @class Global
 * @classdesc Holder to export all the global configuration objects.
 * @memberof module:config/global
 * @property {Object} global - The configuration object with properties
 * used over the whole API.
 * @property {Object} katMap - The configuration object with the correct
 * slugs for {@link https://kat.cr/}.
 * @property {Object} animeProviders - Providers used for scraping anime from
 * {@link https://kat.cr/}.
 * @property {Object} movieProviders - Providers used for scraping shows from
 * {@link https://kat.cr/}.
 * @property {Object} showProviders - Providers used for scraping movies from
 * {@link https://kat.cr/}.
 */
export { global, katAnimeMap, katShowMap, animeProviders, movieProviders, showProviders };
