import hooks from 'hooks';

import Util from '../src/Util';
import Anime from '../src/models/Anime';
import Movie from '../src/models/Movie';
import Show from '../src/models/Show';

import animeData from './anime.json';
import movieData from './movie.json';
import showData from './show.json';

hooks.beforeAll((transaction, done) => {
  const util = new Util();

  const anime = util.executeCommand('NODE_ENV=test ../build/popcorn-api.js -i ../test/anime.json');
  const movie = util.executeCommand('NODE_ENV=test ../build/popcorn-api.js -i ../test/movie.json');
  const show = util.executeCommand('NODE_ENV=test ../build/popcorn-api.js -i ../test/show.json');

  Promise.all([anime, movie, show])
    .then(res => done())
    .catch(err => done(err));
});

hooks.before('Logs > Error Logs > Get Error Logs', transaction => {
  transaction.skip = true;
});

hooks.before('Export > Export > Export Collection', transaction => {
  transaction.skip = true;
});
