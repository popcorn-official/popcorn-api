# Popcorn API

[![Build Status](https://travis-ci.org/popcorn-official/popcorn-api.svg?branch=master)]()
[![Dependency Status](https://david-dm.org/popcorn-official/popcorn-api.svg)](https://david-dm.org/popcorn-official/popcorn-api)
[![devDependency Status](https://david-dm.org/popcorn-official/popcorn-api/dev-status.svg)](https://david-dm.org/popcorn-official/popcorn-api#info=devDependencies)

Popcorn API is developed to make it easier for anyone to create their own version of [Popcorn Time](http://popcorntime.sh). It contains:

- Metadata about movies (taken from Trakt).
- Metadata about TV Shows and individual episodes (taken from Trakt).
- Multiple quality magnet links for every episode.
- Ability to easily filter content to the user's content.
- Add content manually through the CLI.

# Installation

1. Install MongoDB.
2. Install NodeJS (at least Node v5.0.0 or greater).
3. Clone the repository with: `git clone https://github.com/popcorn-official/popcorn-api.git`.
4. Install `gulp` globally with `[sudo] npm install -g gulp`.
5. Install dependencies of Popcorn API with `cd popcorn-api` and `npm install`.
6. Build the ES5 code with `gulp build`.

# CLI

##### npm
The following commands are defined in the `package.json`:

```
 $ npm run start                    # Run Popcorn API and start the scraping process.
 $ npm run start-dev                # Same as above, but in development mode.
 $ npm run server                   # Run Popcorn API, but do not start the scraping process.
 $ npm run server-dev               # Same as above, but in development mode.
 $ npm run forever                  # Run Popcorn API with the 'forever' module.
 $ npm run docs                     # Generate the documentation of the API.
```

##### Gulp
The following commands are defined by Gulp:

```
 $ gulp build                       # Transpile the ES6 source code to ES5.
 $ gulp clean                       # Delete the 'build' directory.
 $ gulp default                     # The default gulp task (same as 'gulp build').
 $ gulp watch                       # Watch for any changes in the 'src' directory.
 ```

##### Global
The following commands are available when Popcorn API is installed globally:

```
 $ popcorn-api --content <type>     # Add content to the database.
 $ popcorn-api --run                # Run Popcorn API and start the scraping process.
 $ popcorn-api --server             # Run Popcorn API, but do not start the scraping process.
```

# Documentation

Documentation for the code can be generated with the command `npm run docs`. This will automatically generate the documentation which will be generated in the `./docs` directory. The `index.html` page will be the starting point.

# Known Issues

Know issues are indicated in the code with the `TODO` tag.

- No known issues :)

# Providers

Content from [kat.cr](https://kat.cr/) is grabbed with so called `providers` which can be configured in the `./src/config/providers.js` file. Providers will be converted to a search query to [kat.cr](https://kat.cr/) so each provider can get a maximum of 10.000 torrents (or 400 pages or torrents). You can read more on how to make providers [here](https://github.com/chrisalderson/kat-api-pt).

**An example of a provider:**

```javascript
{
  name: "ZonerLOL",
  query: {
    query: "x264-LOL",
    min_seeds: 3
  }
}
```

# Folder structure

The API has the following folder structure.

```
.
└── src                  # Holding the ES6 source code
    ├── config           # Configuration
    ├── controllers      # REST Controllers
    ├── models           # Models
    └── providers        # Providers
        ├── movie        # Movie providers
        └── show         # Show providers
```

# Routes

## GET - `http://localhost:5000/`

Gives some basic information about the server on which the API is running on.

**Example output:**

```javascript
{
  "repo": "https://github.com/popcorn-official/popcorn-api.git",
  "server": "serv01",
  "status": "Idle",
  "totalMovies": ​6700,
  "totalShows": ​2452,
  "updated": ​1462484100,
  "uptime": ​825385,
  "version": "2.0.0"
}
```

## GET - `http://localhost:5000/logs/error`

Display the error log. Each message will be in JSON format.

## GET - `http://localhost:5000/movies/{page}`

Gives an array of movies. The array has a has a maximum length of 50 movies per page.

**Example output:**

```javascript
[
  {
    "_id": "tt2015381",
    "imdb_id": "tt2015381",
    "title": "Guardians of the Galaxy",
    "year": "2014",
    "synopsis": "Light years from Earth, 26 years after being abducted, Peter Quill finds himself the prime target of a manhunt after discovering an orb wanted by Ronan the Accuser.",
    "runtime": "121",
    "released": 1406851200,
    "trailer": "http://youtube.com/watch?v=2LIQ2-PZBC8",
    "certification": "PG-13",
    "torrents": {
      "en": {
        "1080p": {
          "provider": "Z0n321",
          "fileSize": "8.74 GB",
          "size": 9384503541,
          "peer": 114,
          "seed": 91,
          "magnet": "magnet:?xt=urn:btih:8A8CBF1DF12D459AF26B01DC3C584A3631E0C2B5&dn=guardians+of+the+galaxy+2014+1080p+bluray+x264+sparks&tr=udp%3A%2F%2Ftracker.publicbt.com%2Fannounce&tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce",
          "url": "magnet:?xt=urn:btih:8A8CBF1DF12D459AF26B01DC3C584A3631E0C2B5&dn=guardians+of+the+galaxy+2014+1080p+bluray+x264+sparks&tr=udp%3A%2F%2Ftracker.publicbt.com%2Fannounce&tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce"
        }
      }
    },
    "genres": [
      "adventure",
      "fantasy",
      "science-fiction"
    ],
    "images": {
      "banner": "https://walter.trakt.us/images/movies/000/082/405/banners/original/592c80e5b3.jpg",
      "fanart": "https://walter.trakt.us/images/movies/000/082/405/fanarts/original/d2e37f8511.jpg",
      "poster": "https://walter.trakt.us/images/movies/000/082/405/posters/original/a189960d53.jpg"
    },
    "rating": {
      "hated": 100,
      "loved": 100,
      "votes": 21025,
      "watching": 1,
      "percentage": 83
    }
  },
  ...
]
```

## GET - `http://localhost:5000/movie/{imdb_id}`

Gives information about a single movie based on the given imdb id.

**Example output:**

```javascript
[
  {
    "_id": "tt2015381",
    "imdb_id": "tt2015381",
    "title": "Guardians of the Galaxy",
    "year": "2014",
    "synopsis": "Light years from Earth, 26 years after being abducted, Peter Quill finds himself the prime target of a manhunt after discovering an orb wanted by Ronan the Accuser.",
    "runtime": "121",
    "released": 1406851200,
    "trailer": "http://youtube.com/watch?v=2LIQ2-PZBC8",
    "certification": "PG-13",
    "torrents": {
      "en": {
        "1080p": {
          "provider": "Z0n321",
          "fileSize": "8.74 GB",
          "size": 9384503541,
          "peer": 114,
          "seed": 91,
          "magnet": "magnet:?xt=urn:btih:8A8CBF1DF12D459AF26B01DC3C584A3631E0C2B5&dn=guardians+of+the+galaxy+2014+1080p+bluray+x264+sparks&tr=udp%3A%2F%2Ftracker.publicbt.com%2Fannounce&tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce",
          "url": "magnet:?xt=urn:btih:8A8CBF1DF12D459AF26B01DC3C584A3631E0C2B5&dn=guardians+of+the+galaxy+2014+1080p+bluray+x264+sparks&tr=udp%3A%2F%2Ftracker.publicbt.com%2Fannounce&tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce"
        }
      }
    },
    "genres": [
      "adventure",
      "fantasy",
      "science-fiction"
    ],
    "images": {
      "banner": "https://walter.trakt.us/images/movies/000/082/405/banners/original/592c80e5b3.jpg",
      "fanart": "https://walter.trakt.us/images/movies/000/082/405/fanarts/original/d2e37f8511.jpg",
      "poster": "https://walter.trakt.us/images/movies/000/082/405/posters/original/a189960d53.jpg"
    },
    "rating": {
      "hated": 100,
      "loved": 100,
      "votes": 21025,
      "watching": 1,
      "percentage": 83
    }
  },
  ...
]
```

## GET - `http://localhost:5000/random/movie`

Gives a random movie from the database. The output will be similar to the on directly above.

## GET - `http://localhost:5000/shows/{page}`

Gives an array of shows. The array has a has a maximum length of 50 shows per page.

**Example output:**

```javascript
[
  {
    "_id": "tt0944947",
    "imdb_id": "tt0944947",
    "tvdb_id": "121361",
    "title": "Game of Thrones",
    "year": "2011",
    "slug": "game-of-thrones",
    "num_seasons": 5,
    "images": {
      "poster": "https://walter.trakt.us/images/shows/000/001/390/posters/original/93df9cd612.jpg",
      "fanart": "https://walter.trakt.us/images/shows/000/001/390/fanarts/original/76d5df8aed.jpg",
      "banner": "https://walter.trakt.us/images/shows/000/001/390/banners/original/9fefff703d.jpg"
    },
    "rating": {
      "percentage": 94,
      "watching": 626,
      "votes": 47012,
      "loved": 100,
      "hated": 100
    }
  },
  {
    "_id": "tt0903747",
    "imdb_id": "tt0903747",
    "tvdb_id": "81189",
    "title": "Breaking Bad",
    "year": "2008",
    "slug": "breaking-bad",
    "num_seasons": 5,
    "images": {
      "banner": "https://walter.trakt.us/images/shows/000/001/388/banners/original/c53872a7e2.jpg",
      "fanart": "https://walter.trakt.us/images/shows/000/001/388/fanarts/original/fdbc0cb02d.jpg",
      "poster": "https://walter.trakt.us/images/shows/000/001/388/posters/original/fa39b59954.jpg"
    },
    "rating": {
      "hated": 100,
      "loved": 100,
      "votes": 39660,
      "watching": 35,
      "percentage": 94
    }
  },
  ...
]
```

## GET - `http://localhost:5000/show/{imdb_id}`

Gives information about a single show based on the given imdb id.

**Example output:**

```javascript
{
  "_id": "tt0944947",
  "imdb_id": "tt0944947",
  "tvdb_id": "121361",
  "title": "Game of Thrones",
  "year": "2011",
  "slug": "game-of-thrones",
  "synopsis": "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war. All while a very ancient evil awakens in the farthest north. Amidst the war, a neglected military order of misfits, the Night's Watch, is all that stands between the realms of men and the icy horrors beyond.",
  "runtime": "60",
  "country": "us",
  "network": "HBO",
  "air_day": "Sunday",
  "air_time": "21:00",
  "status": "returning series",
  "num_seasons": 5,
  "last_updated": 1464725906217,
  "__v": 0,
  "episodes": [
    {
      "torrents": {
        "0": {
          "provider": "VTV",
          "peers": 303,
          "seeds": 290,
          "url": "magnet:?xt=urn:btih:D7D4BA47D984061F942D0D2F030AA927C943387E&dn=game+of+thrones+6x05+720p+hdtv+x264+avs+vtv&tr=udp%3A%2F%2Ftracker.publicbt.com%2Fannounce&tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce"
        },
        "720p": {
          "provider": "VTV",
          "peers": 303,
          "seeds": 290,
          "url": "magnet:?xt=urn:btih:D7D4BA47D984061F942D0D2F030AA927C943387E&dn=game+of+thrones+6x05+720p+hdtv+x264+avs+vtv&tr=udp%3A%2F%2Ftracker.publicbt.com%2Fannounce&tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce"
        }
      },
      "watched": {
        "watched": false
      },
      "first_aired": 1463965200,
      "date_based": false,
      "overview": "Tyrion seeks a strange ally. Bran learns a great deal. Brienne goes on a mission. Arya is given a chance to prove herself.",
      "title": "The Door",
      "episode": 5,
      "season": 6,
      "tvdb_id": 5600132
    },
    ...
  ],
  "genres": [
    "drama",
    "fantasy",
    "science-fiction",
    "action",
    "adventure"
  ],
  "images": {
    "poster": "https://walter.trakt.us/images/shows/000/001/390/posters/original/93df9cd612.jpg",
    "fanart": "https://walter.trakt.us/images/shows/000/001/390/fanarts/original/76d5df8aed.jpg",
    "banner": "https://walter.trakt.us/images/shows/000/001/390/banners/original/9fefff703d.jpg"
  },
  "rating": {
    "percentage": 94,
    "watching": 626,
    "votes": 47012,
    "loved": 100,
    "hated": 100
  }
}
```

# Query strings

The following routes support query strings:

- **GET - `http://localhost:5000/movies/{page}`**
- **GET - `http://localhost:5000/shows/{page}`**

## Sorting

`sort=`

Possible options for movies are:

- `last added`: sort by the release date of the movies.
- `rating`: sort by the highest rated movies.
- `title`: sort by the title of the movies.
- `trending`: sort by trending movies.
- `year`: sort by the release year of the movies.

Possible options for shows are:

- `name`: sort by the title of the shows.
- `rating`: sort by the highest rated shows.
- `trending`: sort by trending shows.
- `updated` sort by the most recently aired shows.
- `year`: sort by the release year of the movies.

## Ordering

`order=`

To order ascending: `1`

To order descending: `-1`

## Genres

`genre=`

The API supports the following genres:

- action
- adventure
- animation
- comedy
- crime
- disaster
- documentary
- drama
- eastern
- family
- fan-film
- fantasy
- film-noir
- history
- holiday
- horror
- indie
- music
- mystery
- none
- road
- romance
- science-fiction
- short
- sports
- sporting-event
- suspense
- thriller
- tv-movie
- war
- western

## Keywords

`keywords=`

Search based on keywords.

# Versioning

For transparency and insight into our release cycle, and for striving to maintain backward compatibility, this project will be maintained according to the [Semantic Versioning](http://semver.org/) guidelines as much as possible.

Releases will be numbered with the following format: `<major>.<minor>.<patch>-<build>`

Constructed with the following guidelines:

- A new _major_ release indicates a large change where backwards compatibility is broken.
- A new _minor_ release indicates a normal change that maintains backwards compatibility.
- A new _patch_ release indicates a bugfix or small change which does not affect compatibility.
- A new _build_ release indicates this is a pre-release of the version.

# License

MIT License

Copyright (c) 2016 - Popcorn API - Released under the [MIT license](LICENSE.txt).

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

--------------------------------------------------------------------------------

**This project and the distribution of this project is not illegal, nor does it violate _any_ DMCA laws. The use of this project, however, may be illegal in your area. Check your local laws and regulations regarding the use of torrents to watch potentially copyrighted content. The maintainers of this project do not condone the use of this project for anything illegal, in any state, region, country, or planet. _Please use at your own risk_.**

--------------------------------------------------------------------------------

Copyright (c) 2016 - Popcorn API - Released under the [MIT license](LICENSE.txt).
