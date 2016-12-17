# Overview

[![Build Status](https://travis-ci.org/popcorn-official/popcorn-api.svg?branch=development)](https://travis-ci.org/popcorn-official/popcorn-api)
[![Dependency Status](https://david-dm.org/popcorn-official/popcorn-api.svg)](https://david-dm.org/popcorn-official/popcorn-api)
[![devDependency Status](https://david-dm.org/popcorn-official/popcorn-api/dev-status.svg)](https://david-dm.org/popcorn-official/popcorn-api#info=devDependencies)
[![document](https://popcorn-official.github.io/popcorn-api/badge.svg)](https://popcorn-official.github.io/popcorn-api/source.html)

Popcorn API is developed to make it easier for anyone to create their own version of [Popcorn Time](http://popcorntime.sh). It contains:

- Metadata about movies (taken from Trakt).
- Metadata about TV shows and individual episodes (taken from Trakt).
- Metadata about anime shows (taken from Hummingbird).
- Multiple quality magnet links for every episode.
- Ability to easily filter content to the user's content.
- Add content manually through the CLI.

# Documentation

Documentation for the code can be generated with the command `npm run docs`. This will automatically generate the documentation which will be located in the `docs` directory. The `index.html` page will be the starting point. You can also view the documentation online right [here](https://popcorn-official.github.io/popcorn-api/manual/index.html). Or checkout the documentation for the API routes [here](http://docs.popcornofficial.apiary.io/).

# Folder structure

The API has the following folder structure.

```
.
├── docs                          # Folder with the ESDoc generated documentation for the API.
├── manual                        # Folder with markdown files used by the documentation.
└── src                           # Holding the ES6 source code
    ├── config                    # Configuration
    ├── controllers               # REST Controllers
    ├── models                    # Models
    ├── providers                 # Providers
        ├── anime                 # Anime providers
        ├── extractors            # Torrent extractors
        ├── helpers               # Helpers to insert data
        ├── movies                # Movie providers
        └── shows                 # Show providers
    ├── cli.js                    # CLI part of the API
    ├── index.js                  # Starting point of the API
    ├── popcorn-api.js            # Entry for the command line
    ├── scraper.js                # Scrape for content
    └── util.js                   # Useful utilities
```

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
