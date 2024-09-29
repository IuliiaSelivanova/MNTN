const gulp = require('gulp');
const gulpConnect = require('gulp-connect');
const gulpUglify = require('gulp-uglify');
const gulpPug = require('gulp-pug');
const gulpImageMin = require('gulp-imagemin');
const gulpData = require('gulp-data');
const scss = require('gulp-sass')(require('sass'));
const gulpif = require('gulp-if');
const gulpCleanCSS = require('gulp-clean-css');
const plumber = require('gulp-plumber');
const del = require('delete');
const svgSprite = require('gulp-svg-sprite');
const ghPages = require('gulp-gh-pages');

const outputDir = 'static';

const isProduction = process.env.NODE_ENV === 'production';

const srcStyles = ['src/**/*.css', 'src/**/*.scss', 'src/**/*.sass'];
const srcPug = 'src/**/*.pug';
const srcJS = 'src/**/*.js';
const srcSVG = 'src/assets/*.svg';
const srcImages = ['src/**/*.svg', 'src/**/*.jpg', 'src/**/*.gif', 'src/**/*.png'];

function fonts() {
    return gulp.src(['./src/fonts/**/*.ttf', './src/fonts/**/*.otf'])
        .pipe(gulp.dest('static/fonts'))
        .pipe(gulpif(!isProduction, gulpConnect.reload()));
};

function server() {
    return gulpConnect.server({
        port: 8080,
        root: 'static/',
        livereload: true
    });
}

function clean(cb) {
    del([outputDir], cb);
}

function styles() {
    return gulp.src(srcStyles)
        .pipe(scss({ outputStyle: 'compressed'}))
        .pipe(gulpCleanCSS())
        .pipe(gulp.dest(outputDir))
        .pipe(gulpif(!isProduction, gulpConnect.reload()));
}

function svg() {
    return gulp.src(srcSVG, { cwd: '' })
        .pipe(plumber())
        .pipe(svgSprite({
            mode: {
                css: {
                    render: {
                        css: true
                    }
                }
            }
        }))
        .on('error', function(error) {
            console.log(error)
        })
        .pipe(gulp.dest(outputDir));
}

function pug() {
    return gulp.src(srcPug)
        .pipe(gulpData(() => {
            return {
                __dirname: __dirname,
                require: require
            };
        }))
        .pipe(gulpPug())
        .pipe(gulp.dest(outputDir))
        .pipe(gulpif(!isProduction, gulpConnect.reload()));
}

function images() {
    return gulp.src(srcImages)
        .pipe(gulpif(isProduction, gulpImageMin()))
        .pipe(gulp.dest(outputDir))
        .pipe(gulpif(!isProduction, gulpConnect.reload()));
}

function js() {
    return gulp.src(srcJS)
        .pipe(gulpif(isProduction, gulpUglify()))
        .pipe(gulp.dest(outputDir))
        .pipe(gulpif(!isProduction, gulpConnect.reload()));
}

function watch() {
    gulp.watch(srcJS, gulp.series(js));
    gulp.watch(srcSVG, gulp.series(svg));
    gulp.watch(srcStyles, gulp.series(styles));
    gulp.watch(srcImages, gulp.series(images));
    gulp.watch(srcPug, gulp.series(pug));
}

exports.default = gulp.parallel(
    watch,
    gulp.series(clean, js, svg, pug, styles, images, fonts, server)
);
exports.server = server;
exports.clean = clean;
exports.build = gulp.series(clean, js, svg, pug, images, styles, fonts);
exports.dev = gulp.parallel(
    watch,
    gulp.series(clean, js, pug, svg, styles, images, fonts, server)
);

gulp.task('deploy', function() {
    return gulp.src('./static/**/*')
        .pipe(ghPages());
})
