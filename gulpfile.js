const gulp = require("gulp");
const plumber = require("gulp-plumber");
const sourcemap = require("gulp-sourcemaps");
const sass = require("gulp-sass");
const rename = require("gulp-rename");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const svgstore = require("gulp-svgstore");
const sync = require("browser-sync").create();
const csso = require("gulp-csso");
const uglify = require("gulp-uglify");
const imagemin = require("gulp-imagemin");
const webp = require("gulp-webp");
const del = require("del");
const posthtml = require("gulp-posthtml");
const htmlmin = require("gulp-htmlmin");
const include = require("posthtml-include");

// Clean

const clean = () => {
  return del("build");
};
exports.clean = clean;

// Copy fonts, img, js, ico

const copy = () => {
  return gulp
    .src(
      [
        "source/fonts/**/*.{woff,woff2}",
        "source/img/**",
        "source/js/*.js",
        "source/*.ico",
      ],
      {
        base: "source",
      }
    )
    .pipe(gulp.dest("build"));
};

exports.copy = copy;

// Styles

const styles = () => {
  return gulp
    .src("source/sass/style.scss")
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass())
    .pipe(postcss([autoprefixer()]))
    .pipe(sourcemap.write("."))
    .pipe(gulp.dest("build/css"))
    .pipe(csso())
    .pipe(rename("style.min.css"))
    .pipe(gulp.dest("build/css"))
    .pipe(sync.stream());
};

exports.styles = styles;

// Sprite

const sprite = () => {
  return gulp
    .src("source/img/svg_inline/*.svg")
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("build/img"));
};

exports.sprite = sprite;

// Html minify

const html = () => {
  return gulp
    .src("source/*.html")
    .pipe(posthtml([include()]))
    .pipe(htmlmin())
    .pipe(gulp.dest("build/"))
    .pipe(sync.stream());
};

exports.html = html;

// Img minify

const images = () => {
  return gulp
    .src("source/img/**/*.{jpg,png,svg}")
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({ quality: 90, progressive: true }),
        imagemin.optipng({ optimizationLevel: 3 }),
        imagemin.svgo({
          plugins: [
            { removeViewBox: false },
            { cleanupIDs: false },
            { removeRasterImages: true },
            { removeUselessStrokeAndFill: false },
          ],
        }),
      ])
    )
    .pipe(gulp.dest("source/img"));
};

exports.images = images;

// WebP

const createWebp = () => {
  return gulp
    .src("source/img/**/*.{png,jpg}")
    .pipe(webp({ quality: 90 }))
    .pipe(gulp.dest("source/img"));
};
exports.webp = createWebp;

// Js minify

const scripts = () => {
  return gulp
    .src("source/js/index.js")
    .pipe(gulp.dest("build/js"))
    .pipe(uglify())
    .pipe(rename("index.min.js"))
    .pipe(gulp.dest("build/js"));
};

exports.scripts = scripts;

// Server

const server = (done) => {
  sync.init({
    server: {
      baseDir: "build",
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
};

exports.server = server;

// Watcher

const watcher = () => {
  gulp.watch("source/sass/**/*.scss", gulp.series(styles));
  gulp.watch("source/*.html", gulp.series(html)).on("change", sync.reload);
  gulp.watch("source/js/*.js", gulp.series(scripts)).on("change", sync.reload);
};

// Build

const build = gulp.series(clean, copy, styles, sprite, html, scripts);

exports.build = build;

// Start

const start = gulp.series(build, server, watcher);

exports.start = start;
