# Tutorial

In this tutorial section you can read about the scraping process of the API.

## Scraper

The [`Scraper`](https://popcorn-official.github.io/popcorn-api/class/src/scraper.js~Scraper.html) class is the entry point to start the scraping process with the [`scrape`](https://popcorn-official.github.io/popcorn-api/class/src/scraper.js~Scraper.html#instance-method-scrape) method. This method will iterate through an array of methods to scrape each individual content provider.

```javascript
scrape() {
  Scraper._util.setLastUpdated();

  asyncq.eachSeries([
    this._scrapeExtratorrentShows,
    this._scrapeEZTVShows,
    this._scrapeKATShows,

    this._scrapeExtratorrentMovies,
    this._scrapeKATMovies,
    this._scrapeYTSMovies,

    this._scrapeExtratorrentAnime,
    this._scrapeKATAnime,
    this._scrapeHorribelSubsAnime,
    this._scrapeNyaaAnime
  ], scraper => scraper()).then(value => Scraper._util.setStatus())
    .catch(err => Scraper._util.onError(`Error while scraping: ${err}`));
};
```

## Content Providers

Popcorn API gets its torrent content from various sources. Here you can see where the content is coming from.

|                                             | Anime | Movie | Show |
|---------------------------------------------|-------|-------|------|
| [ExtraTorrent](https://extratorrent.cc)     | X [1] | X     | X    |
| [EZTV](https://eztv.ag/)                    |       |       | X    |
| [Horriblesubs](https://horriblesubs.info/)  | X     |       |      |
| [KAT](https://kat.cr/) [2]                  | X     | X     | X    |
| [Nyaa](https://nyaa.se/)                    | X     |       |      |
| [YTS](https://yts.ag/)                      |       | X     |      | |

 - [1] Anime can be scraped from ExtraTorrent, but currently this is not done. The reason for this is because it is very ineffective to scrape anime torrents from [ExtraTorrent](https://extratorrent.cc/). The ineffectiveness is due to a lack of good ExtraTorrent providers.

 - [2] The main website of [KAT](https://kat.cr/) is down at the moment, but it was used for movie and tv show scraping. Around the development of the anime provider [KAT](https://kat.cr/) got taken down. If [KAT](https://kat.cr/) ever comes back in the state it was before it was taken down it can be used again. If this scenario happens the `baseUrl` of [kat-api-pt](https://github.com/ChrisAlderson/kat-api-pt) needs to be changed, or the `options` in the constructor need to change to override the default `baseUrl`.

### ExtraTorrent

Content from [extratorrent.cc](https://extratorrent.cc/) is grabbed with so-called 'ExtraTorrent providers' which are defined in the
 [`extratorrentAnimeProviders`](https://popcorn-official.github.io/popcorn-api/variable/index.html#static-variable-extratorrentAnimeProviders),  [`extratorrentMovieProviders`](https://popcorn-official.github.io/popcorn-api/variable/index.html#static-variable-extratorrentMovieProviders) and [`extratorrentShowProviders`](https://popcorn-official.github.io/popcorn-api/variable/index.html#static-variable-extratorrentShowProviders) arrays. The ExtraTorrent providers will be converted to a search query to [extratorrent.cc](https://extratorrent.cc/) by the [extratorrent-api](https://github.com/ChrisAlderson/extratorrent-api) module.

Each provider needs a `name` property and a `query` property. The `name` property is a `String` will be used for logging purposes so that issues with the provider can be figured out easier. The `query` property is an `Object` which can contain various properties. These properties will be converted into a search query to [extratorrent.cc](https://extratorrent.cc/):

The following `query` properties can be used:
```
- page                    # Number of the page you want to search
- with_words              # With all of the words **REQUIRED!**
- extact                  # With the exact phrase
- without                 # Without the words
- category                # See categories
- added                   # Number of last added 1 day (1), 3 days (3) or week (7)
- seeds_from              # Seeds more than the number given
- seeds_to                # Seeds less than the number given
- leechers_from           # Leecher more than the number given
- leechers_to             # Leechers less than the number given
- size_from               # Torrent size more than the number given
- size_to                 # Torrent size less than the number given
- size_type               # b for byte, kb for kilobyte etc
```

All three types of content can be scraped from [extratorrent.cc](https://extratorrent.cc/) through the `ExtraTorrent` class in each folder of the providers. By default the `ExtraTorrent` class adds a few default properties to the providers. The `page` property does not need to be indicated since the algorithm for scraping [extratorrent.cc](https://extratorrent.cc/) will go through all the available pages (max of 200 pages/10.000 torrents due to site limitations). The `category` property will also have a default value to its corresponding content.

**An example of an ExtraTorrent provider:**
```javascript
{
  name: 'ETTV LOL',
  query: {
    with_words: 'ettv hdtv x264 lol',
    without: '720p 1080p'
  }
}
```

If you want to make a provider for [extratorrent.cc](https://extratorrent.cc/) it is highly recommended you try it first in the browser by manually going to [extratorrent.cc](https://extratorrent.cc/) and search for the content. This is because the title of the torrent will be subjected to regular expressions by the [`Extractors`](#extractors) to 'extract' information about the torrent which will be used to find [metadata](#metadata-providers).

### EZTV

Content from [eztv.ag](https://eztv.ag/) is grabbed through the [eztv-api-pt](https://github.com/ChrisAlderson/eztv-api-pt) module. The module contains two methods `getAllShows` and `getShowData`.

#### getAllShows

This method returns a list of all the available shows listed [here](https://eztv.ag/showlist/). Through regular expression it grabs the show title, the id used by [eztv.ag](https://eztv.ag/) and the slug.

```javascript
[{
    show: '10 O\'Clock Live',
    id: '449',
    slug: '10-o-clock-live'
  }, {
    show: '10 Things I Hate About You',
    id: '308',
    slug: '10-things-i-hate-about-you'
  },
  ...
]
```

#### getShowData

Each show from the `getAllShows` can be passed into the `getShowData` method to get more data on the individual show. Through this process the slug can change to another slug or imdb id which is compatible with [Trakt.tv](https://trakt.tv/). Torrents are being added to the `episodes` property which is compatible with the [`Helper`](#helpers) class to insert the torrents into the MongoDB database. Nested within the `episodes` property there is the `season number` within the `season number` is the `episode number` and within the `episode number` are the different `qualities` of the torrent.

```javascript
{ show: '10 O\'Clock Live',
  id: '449',
  slug: 'tt1811399',
  episodes:
    dateBased: false,
    { '1':
      { '1':
         { '480p':
            { url: 'magnet:?xt=urn:btih:LMJXHHNOW33Z3YGXJLCTJZ23WK2D6VO4&dn=10.OClock.Live.S01E01.WS.PDTV.XviD-PVR&tr=udp://tracker.openbittorrent.com:80&tr=udp://open.demonii.com:80&tr=udp://tracker.coppersurfer.tk:80&tr=udp://tracker.leechers-paradise.org:6969&tr=udp://exodus.desync.com:6969',
              seeds: 0,
              peers: 0,
              provider: 'EZTV' } },
        ...
      }
    }
}
```

### Horriblesubs

Content from [horriblesubs.info](https://horriblesubs.info/) is grabbed through the [horriblesubs-api](https://github.com/ChrisAlderson/horriblesubs-api) module. The module contains two methods `getAllAnime` and `getAnimeData`. This module is based on [eztv-api-pt](https://github.com/ChrisAlderson/eztv-api-pt) module and the usage of the module within the API is very similar to the [EZTV provider](#eztv).

#### getAllAnime

This method returns a list of all the available shows listed [here](http://horriblesubs.info/shows/). Through the [cheerio](https://github.com/cheeriojs/cheerio) module it grabs the anime title, the slug, and the link to get more details about the anime.

```javascript
[{
  link: '/shows/91-days',
  slug: '91-days',
  title: '91 Days'
}, {
  link: '/shows/absolute-duo',
  slug: 'absolute-duo',
  title: 'Absolute Duo'
}, ...]
```

#### getAnimeData

Each anime from the `getAllAnime` can be passed into the `getAnimeData` method to get more data on the individual anime. Through this process the slug can change to another slug which is compatible with [Hummingbird.me](https://hummingbird.me). The `hs_showid` is added and torrents are being added to the `episodes` property which is compatible with the [`Helper`](#helpers) class to insert the torrents into the MongoDB database. Nested within the `episodes` property there is the `season number` within the `season number` is the `episode number` and within the `episode number` are the different `qualities` of the torrent.

```javascript
{ link: '/shows/91-days',
  slug: 'ninety-one-days',
  title: '91 Days',
  hs_showid: '731',
  episodes:
   { '1':
      { '1':
        { '480':
          { url: 'magnet:?xt=urn:btih:AYIJKPLP5WVVF36O25JBB3FFPNJEBBPQ&tr=http://open.nyaatorrents.info:6544/announce&tr=udp://tracker.openbittorrent.com:80/announce&tr=udp://tracker.coppersurfer.tk:6969/announce',
          seeds: 0,
          peers: 0,
          provider: 'HorribleSubs' } },
        ...
      }
    }
}
```

### KAT

Content from [kat.cr](https://kat.cr/) is grabbed with so-called `KAT providers` which are defined in the
 [`katAnimeProviders`](https://popcorn-official.github.io/popcorn-api/variable/index.html#static-variable-katAnimeProviders),  [`katMovieProviders`](https://popcorn-official.github.io/popcorn-api/variable/index.html#static-variable-katMovieProviders) and [`katShowProviders`](https://popcorn-official.github.io/popcorn-api/variable/index.html#static-variable-katShowProviders) arrays. The KAT providers will be converted to a search query to [kat.cr](https://kat.cr/) by the [kat-api-pt](https://github.com/ChrisAlderson/kat-api-pt) module.

The following `query` properties can be used:
```
 - query               # Search for keywords
 - category            # The category to search for e.g. tv or movies
 - uploader            # The name of the uploader of the torrents
 - min_seeds           # The minimum amount of seeds
 - age                 # The age of the torrents
 - min_files           # The minimum amount of files
 - imdb                # The imdb id for a tv show (only works with category:tv)
 - tvrage              # The tvrage id for a tv show (only works with category:tv)
 - language            # The language of the movie/tv show e.g. en or pl
 - adult_filter        # Filter out the adult torrents
 - verified            # Show only the verified torrents
 - season              # Season number of a tv show (only works with category:tv)
 - episode             # Episode number of a tv show (only works with category:tv)
 - page                # The page to search on.
 - sort_by             # Sort by property
 - order               # Order the list asc or desc
```

All three types of content can be scraped from [kat.cr](https://kat.cr/) through the `KAT` class in each folder of the providers. By default the `KAT` class adds a few default properties to the providers. The `page` property does not need to be indicated since the algorithm for scraping [kat.cr](https://kat.cr/) will go through all the available pages (max of 400 pages/10.000 torrents due to site limitations). The `category` property will also have a default value to its corresponding content. The `adult_filter` and `verified` properties are also turned on by default to filter out any potential harmful content.

**An example of a provider:**
```javascript
{
  name: 'ZonerLOL',
  query: {
    query: 'x264-LOL',
    min_seeds: 3
  }
}
```

If you want to make a provider for [kat.cr](https://kat.cr/) it is highly recommended you try it first in the browser by manually going to [kat.cr](https://kat.cr/) and search for the content. This is because the title of the torrent will be subjected to regular expressions by the [`Extractors`](#extractors) to 'extract' information about the torrent which will be used to find [metadata](#metadata-providers).

### Nyaa

Additional anime content can be scraped from [nyaa.se](https://nyaa.se/), the method for scraping the content is similar to the [ExtraTorrent](#extratorrent) and the [KAT](#kat) method. It uses the [`nyaaAnimeProviders`](https://popcorn-official.github.io/popcorn-api/variable/index.html#static-variable-nyaaAnimeProviders) array, each `Object` in the array will be converted to a search query to [nyaa.se](https://nyaa.se/). This is done by the [nyaa-api-pt](https://github.com/ChrisAlderson/nyaa-api-pt) module.

Each provider needs a `name` property and a `query` property. The `name` property is a `String` will be used for logging purposes so that issues with the provider can be figured out easier. The `query` property is an `Object` which can contain various properties. These properties will be converted into a search query to [nyaa.se](https://nyaa.se/):

The following `query` properties can be used:
```
 - filter              # Trusted uploader filter
 - category            # The category to filter
 - sub_category        # The sub category to filter
 - term                # A search term
 - user                # The id of the uploader
 - offset              # The page to search on
```

Only anime will be scraped on [nyaa.se](https://nyaa.se/), this is because [nyaa.se](https://nyaa.se/) is focuses on East Asian content. The [`Nyaa`]() class will automatically add the `category` and `sub_category` properties. The `offset` does not to be indicated since the algorithm for scraping [nyaa.se](https://nya.se/) will go through all the available pages (max of 100 pages/10.500 torrent due to site limitations).

**An example of a provider:**
```javascript
{
  name: 'Commie',
  query: {
    term: 'mkv',
    user: 76430,
    filter: 'trusted_only'
  }
}
```

If you want to make a provider for [nyaa.se](https://nyaa.se/) it is highly recommended you try if first in the browser by manually to [nyaa.se](https://nyaa.se/) and search for the content. This is because the title of the torrent will be subjected to regular expression by the [`Extractor`](#anime-extractor) for anime content. The information the extractor 'extracts' will be used by the [metadata providers](#metadata-providers).

### YTS

**NOTE:** This provider will most likely be changed to use a YTS API wrapper module. No API wrappers exists for YTS which are using promises, so one needs to be made.

## Extractors

The extractors are made to get torrents from the content provider and extract content data from torrents.

### Base Extractor

The base extractor is made to extract all the torrents from the [ExtraTorrent](#extratorrent), [KAT](#kat) and [Nyaa](#nyaa) content providers. It has a method to iterate through all the available pages from the content provider and return all the torrents it has found. All extractors will extend this class.

### Anime Extractor

The regular expression needs to get a `title`, `episode` and a `quality` property. A `season` property is optional, if the `season` is not in the episode title it will assume the torrent is from `season` 1. Down below you can see the method to get the needed data for an anime episode. If your content does not match any of these regular expressions, you can add the regular expression to the method.

```javascript
_getAnimeData(torrent) {
  const secondSeasonQuality = /\[.*\].(.*)\W+S(\d)...(\d{2,3})\W+(\d{3,4}p)/i; // [HorribleSubs] Fairy Tail S2 - 70 [1080p].mkv
  const oneSeasonQuality = /\[.*\].(\D+)...(\d{2,3})\W+(\d{3,4}p)/i; // [HorribleSubs] Gangsta - 06 [480p].mkv
  const secondSeason = /\[.*\].(\D+).S(\d+)...(\d{2,3}).*\.mkv/i; // [Commie] The World God Only Knows S2 - 12 [C0A4301E].mkv
  const oneSeason = /\[.*\].(\D+)...(\d{2,3}).*\.mkv/i; // [Commie] Battery - 05 [38EC4270].mkv
  if (torrent.title.match(secondSeasonQuality)) {
   return this._extractAnime(torrent, secondSeasonQuality);
 } else if (torrent.title.match(oneSeasonQuality)) {
   return this._extractAnime(torrent, oneSeasonQuality);
 } else if (torrent.title.match(secondSeason)) {
    return this._extractAnime(torrent, secondSeason);
  } else if  (torrent.title.match(oneSeason)) {
    return this._extractAnime(torrent, oneSeason);
  } else {
    logger.warn(`${this.name}: Could not find data from torrent: '${torrent.title}'`);
  }
};
```

### Movie Extractor

The regular expression for movies needs to get a `title`, `year` and a `quality` property. Down below you can see the method to get the needed data for a movie. If your content does not match any of these regular expressions, you can add the regular expression to the method.

```javascript
_getMovieData(torrent, language) {
  const threeDimensions = /(.*).(\d{4}).[3Dd]\D+(\d{3,4}p)/; // Journey to Space 2015 3D 1080p BRRip Half-SBS x264 AAC-ETRG
  const fourKay = /(.*).(\d{4}).[4k]\D+(\d{3,4}p)/; // Spider Man 2002 4K REMASTERED Bluray 1080p TrueHD x264-Grym
  const withYear = /(.*).(\d{4})\D+(\d{3,4}p)/; // Batman Begins 2005 720p BluRay x264 AC3 - Ozlem
  if (torrent.title.match(threeDimensions)) {
    return this._extractMovie(torrent, language, threeDimensions);
  } else if (torrent.title.match(fourKay)) {
    return this._extractMovie(torrent, language, fourKay);
  } else if (torrent.title.match(withYear)) {
    return this._extractMovie(torrent, language, withYear);
  } else {
    console.warn(`${this.name}: Could not find data from torrent: '${torrent.title}'`);
  }
};
```

### Show Extractor

The regular expression for shows needs to get a `title`, `season`, `episode` and a `quality` property. Down below you can see the method to get the needed data for a show episode. If your content does not match any of these regular expressions, you can add the regular expression to the method.

```javascript
_getShowData(torrent) {
  const seasonBased = /(.*).[sS](\d{2})[eE](\d{2})/; // Dexter S08E09 720p HDTV x264-IMMERSE
  const vtv = /(.*).(\d{1,2})[x](\d{2})/; // The Whispers 1x09 (HDTV-x264-KILLERS)[VTV]
  const dateBased = /(.*).(\d{4}).(\d{2}.\d{2})/; // Jimmy Fallon 2016 08 02 Jonah Hill HDTV x264-CROOKS
  if (torrent.title.match(seasonBased)) {
    return this._extractShow(torrent, seasonBased, false);
  } else if (torrent.title.match(vtv)) {
    return this._extractShow(torrent, vtv, false);
  } else if (torrent.title.match(dateBased)) {
    return this._extractShow(torrent, dateBased, true);
  } else {
    console.warn(`${this.name}: Could not find data from torrent: '${torrent.title}'`);
  }
};
```

## Helpers

The `helper.js` classes in each provider folder helps the providers to insert the scraped data into the MongoDB database. The providers need to call two methods.

### Anime & Show Helpers

The first method to call is [`getHummingbirdInfo`](https://popcorn-official.github.io/popcorn-api/class/src/providers/anime/helper.js~Helper.html#instance-method-getHummingbirdInfo) for anime and [`getTraktInfo`](https://popcorn-official.github.io/popcorn-api/class/src/providers/show/helper.js~Helper.html#instance-method-getTraktInfo) for shows. These methods need a slug as a parameter ([`getTraktInfo`](https://popcorn-official.github.io/popcorn-api/class/src/providers/show/helper.js~Helper.html#instance-method-getTraktInfo) can also use an imdb id). These methods will fetch metadata from [Hummingbird.me](https://hummingbird.me/) or [Trakt.tv](https://trakt.tv) and return an object based on the schema of the mongoose model, but without any episodes.

```javascript
getTraktInfo(slug);
getHummingbirdInfo(slug);
```

The second method to call is the `addEpisodes` method to attach the episodes to the object returned by [`getHummingbirdInfo`](https://popcorn-official.github.io/popcorn-api/class/src/providers/anime/helper.js~Helper.html#instance-method-getHummingbirdInfo) or [`getTraktInfo`](https://popcorn-official.github.io/popcorn-api/class/src/providers/anime/helper.js~Helper.html#instance-method-getHummingbirdInfo). This object is the first parameter, the second one is the episodes object and the third parameter is the slug again.

```javascript
addEpisodes(anime/show, episodes, slug);
```

The episodes are structured in a particular way. In the episodes object you first have the seasons represented by a number. Nested in each season is another object which is the episode which is also represented by a number. In the episode object you have the qualities available for the episode. These qualities can be `480p`, `720p` or `1080p`. Finally inside the quality object you have the `url` to the torrent or magnet link, the amount of `seeds` and `peers` and lastly the name of the provider.

```javascript
{
  '1': {
    '1': {
      '480p': {
        url: 'magnet:?xt=urn:btih:LMJXHHNOW33Z3YGXJLCTJZ23WK2D6VO4&dn=10.OClock.Live.S01E01.WS.PDTV.XviD-PVR&tr=udp://tracker.openbittorrent.com:80&tr=udp://open.demonii.com:80&tr=udp://tracker.coppersurfer.tk:80&tr=udp://tracker.leechers-paradise.org:6969&tr=udp://exodus.desync.com:6969',
        seeds: 0,
        peers: 0,
        provider: 'EZTV'
      }
    }
  }
}
```

### Movie Helper

The first method to call is [`getTraktInfo`](https://popcorn-official.github.io/popcorn-api/class/src/providers/movie/helper.js~Helper.html#instance-method-getTraktInfo). This method need a slug as a parameter, but can also use an imdb id). This method will fetch metadata from [Trakt.tv](https://trakt.tv) and return an object based on the schema of the mongoose model, but without any torrents.

```javascript
getTraktInfo(slug);
```

The second method to call is the [`addTorrents`](https://popcorn-official.github.io/popcorn-api/class/src/providers/movie/helper.js~Helper.html#instance-method-addTorrents) method to attach the torrents to the object returned by [`getTraktInfo`](https://popcorn-official.github.io/popcorn-api/class/src/providers/movie/helper.js~Helper.html#instance-method-getTraktInfo). This object is the first parameter, the second one is the torrents for the movie.

```javascript
addTorrents(movie, torrents);
```

The torrents are structured in a particular way. In the torrents object you first have the language of the torrents represented by a language code e.g. `en`. Nested inside the language are the qualities of the torrents. These qualities can be `720p` or `1080p`. Finally inside the quality object you have the `url` to the torrent or magnet link, the amount of `seeds` and `peers`, the `size` of the torrent in bits, the `fileSize` which is a more easily readable version of `size` and lastly the name of provider.

```javascipt
{
  'en': {
    '720p': {
      url: 'magnet:?xt=urn:btih:1BEA4C992D1F7A765F3C943E627E881AC7FDAA35&tr=udp://glotorrents.pw:6969/announce&tr=udp://tracker.opentrackr.org:1337/announce&tr=udp://torrent.gresille.org:80/announce&tr=udp://tracker.openbittorrent.com:80&tr=udp://tracker.coppersurfer.tk:6969&tr=udp://tracker.leechers-paradise.org:6969&tr=udp://p4p.arenabg.ch:1337&tr=udp://tracker.internetwarriors.net:1337',
      seed: 156,
      peer: 44,
      size: 819829146,
      filesize: '781.85 MB',
      provider: 'YTS'
    }
  }
}
```

## Metadata Providers

Metadata providers are providers which get data on a movie or get seasonal information from a show. Popcorn API uses two API services to get its metadata on anime, movies and shows.

### [Trakt.tv](https://trakt.tv/)
[Trakt.tv](https://trakt.tv/) is the metadata provider for movies and shows. It uses a module from [Jean van Kasteel](https://github.com/vankasteelj) called [trakt.tv](https://github.com/vankasteelj/trakt.tv). For more information about the Trakt API you can click [here](http://docs.trakt.apiary.io/).

### [TheTVDB.com](https://thetvdb.com/)
[TheTVDB.com](https://thetvdb.com/) is the metadata provider for shows which have are datebased like '@Midnight'. It uses a module from [Ed Wellbrook](https://github.com/edwellbrook) called [node-tvdb](https://github.com/edwellbrook/node-tvdb). For more information about the TVDB API you can click [here](https://www.thetvdb.com/wiki/index.php/Programmers_API).

### [Hummingbird.me](https://hummingbird.me)
[Hummingbird.me](https://hummingbird.me) is the metadata provider for anime. It uses the [hummingbird-api](https://github.com/ChrisAlderson/hummingbird-api) module. For more information about the Hummingbird API you can click [here](https://github.com/hummingbird-me/hummingbird/wiki).

### [Fanart.tv](https://fanart.tv/)
[Fanart.tv](https://fanart.tv/) is the provider of the images used by movies and shows. It uses the [fanart.tv-api](https://github.com/ChrisAlderson/fanart.tv-api/). For more information about the Fanart API you can click [here](http://docs.fanarttv.apiary.io/#).

### [OMDBapi.com](https://www.omdbapi.com/)
[OMDBapi.com](https://www.omdbapi.com/) is the provider of the images used by movies. It uses the [omdb-api-pt](https://github.com/ChrisAlderson/omdb-api-pt). For more information about the OMDB API you can click [here](https://www.omdbapi.com/).

### [TheMovieDB.org](https://www.themoviedb.org/)
[TheMovieDB.org](https://www.themoviedb.org/) is the provider for the images used by movies and shows. It uses a module from [sarathkcm](https://github.com/sarathkcm) called [themoviedbclient](https://github.com/sarathkcm/TheMovieDBClient). For more information about The MovieDB you can click [here](https://www.themoviedb.org/documentation/api).
