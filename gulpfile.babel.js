// Import the neccesary modules.
import del from "del";
import gulp from "gulp";
import babel from "gulp-babel";

/**
 * @description The default build function.
 * @returns {Gulp} - The transpiled source code.
 */
const build = () => gulp.src("src/**/*.js").pipe(babel()).pipe(gulp.dest("build"));

// Delete the `build` directory.
gulp.task("clean", () => del(["build"]));

// Transpile the `src` directory with Babel.
gulp.task("build", ["clean"], build);

// Watch the `src` directory and build when a file changes.
gulp.task("watch", ["build"], () => gulp.watch("src/**/*.js", ["build"]));

// Set the default task as `build`.
gulp.task("default", ["clean"], build);
