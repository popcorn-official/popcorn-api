// Import the necessary modules.
// @flow
import 'dotenv/config'
// @flow-ignore
import hooks from 'hooks'
import pMap from 'p-map'
import { createWriteStream } from 'fs'
import {
  Database,
  PopApi
} from 'pop-api'
import { join } from 'path'

import testAnimeMovie from './test/data/animemovie'
import testAnimeShow from './test/data/animeshow'
import testMovie from './test/data/movie'
import testShow from './test/data/show'
import {
  AnimeMovie,
  AnimeShow,
  Movie,
  Show
} from './src/models'
import { name } from './package'

process.env.TEMP_DIR = process.env.TEMP_DIR || join(...['tmp'])

const tempDir = process.env.TEMP_DIR
const models = [{
  c: AnimeMovie,
  m: new AnimeMovie(testAnimeMovie)
}, {
  c: AnimeShow,
  m: new AnimeShow(testAnimeShow)
}, {
  c: Movie,
  m: new Movie(testMovie)
}, {
  c: Show,
  m: new Show(testShow)
}]

/**
 * The database middleware to connect to MongoDb.
 * @type {Database}
 */
let database: Database

hooks.beforeAll((t, done) => {
  database = new Database(PopApi, {
    database: name
  })
  createWriteStream(join(...[
    tempDir,
    `${name}.log`
  ])).end()

  return database.connect().then(() => {
    return pMap(models, model => {
      return model.c.findOneAndUpdate({
        _id: model.m.id
      }, model.m, {
        upsert: true,
        new: true
      }).then(res => hooks.log(`Inserted content: '${res.id}'`))
    })
  }).then(() => database.disconnect())
    .then(() => hooks.log('beforeAll: ok'))
    .then(() => done())
    .catch(err => {
      hooks.error(`beforeAll: '${err}'`)
      done()
    })
})

hooks.afterAll((t, done) => {
  return database.connect().then(() => {
    return pMap(models, model => {
      return model.c.findOneAndRemove({
        _id: model.m.id
      }).then(res => hooks.log(`Removed content: '${res.id}'`))
    })
  }).then(() => database.disconnect())
    .then(() => hooks.log('afterAll: ok'))
    .then(() => done())
    .catch(err => {
      hooks.error(`afterAll: '${err}'`)
      done()
    })
})
