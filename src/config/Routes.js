// Import the neccesary modules.
import IndexController from "../controllers/IndexController";
import ExportController from "../controllers/ExportController";
import AnimeController from "../controllers/AnimeController";
import MovieController from "../controllers/MovieController";
import ShowController from "../controllers/ShowController";

/** Class for setting up the routes for the API. */
export default class Routes {

  /**
   * Create a routes object.
   * @param {Express} app - The ExpresssJS instance.
   */
  constructor(app) {
    /**
     * The index controller.
     * @type {IndexController}
     */
    Routes._indexController = new IndexController();

    /**
     * The export controller.
     * @type {ExportController}
     */
    Routes._exportController = new ExportController();

    /**
     * The anime controller.
     * @type {AnimeController}
     */
    Routes._animeController = new AnimeController();

    /**
     * The movie controller.
     * @type {MovieController}
     */
    Routes._movieController = new MovieController();

    /**
     * The show controller.
     * @type {ShowController}
     */
    Routes._showController = new ShowController();

    // Setup the routes.
    Routes._setupRoutes(app);
  }

  /**
   * Setup ExpressJS routing.
   * @param {ExpressJS} app - The ExpresssJS application.
   */
  static _setupRoutes(app) {
    app.get("/status", Routes._indexController.getIndex);
    app.get("/logs/error", Routes._indexController.getErrorLog);

    app.get("/animes", Routes._animeController.getAnimes);
    app.get("/animes/:page", Routes._animeController.getPage);
    app.get("/anime/:id", Routes._animeController.getAnime);
    app.get("/random/anime", Routes._animeController.getRandomAnime);

    app.get("/movies", Routes._movieController.getMovies);
    app.get("/movies/:page", Routes._movieController.getPage);
    app.get("/movie/:id", Routes._movieController.getMovie);
    app.get("/random/movie", Routes._movieController.getRandomMovie);

    app.get("/shows", Routes._showController.getShows);
    app.get("/shows/:page", Routes._showController.getPage);
    app.get("/show/:id", Routes._showController.getShow);
    app.get("/random/show", Routes._showController.getRandomShow);

    app.get("/exports/:collection", Routes._exportController.getExport);
  }

}
