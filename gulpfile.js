var gulp = require('gulp');
const $ = require('gulp-load-plugins')();
// var jade = require('gulp-jade');
// var sass = require('gulp-sass');
// var plumber = require('gulp-plumber');
// var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var mainBowerFiles = require('main-bower-files');
var browserSync = require('browser-sync').create();
var minimist = require('minimist')

var envOptions = {
  string: 'env',
  default: { env: 'develop' }
}
var options = minimist(process.argv.slice(2), envOptions)
console.log(options)

gulp.task('clean', function () {
  return gulp.src(['./.tmp', './public'], {read: false, allowEmpty: true})
    .pipe($.clean());
});

gulp.task('copyHTML', function(){
    return gulp.src('./source/**/*.html')
      .pipe(gulp.dest('./public/'))
})

gulp.task('jade', function() {
  // var YOUR_LOCALS = {};
  return gulp.src('./source/**/*.jade')
    .pipe($.plumber())
    .pipe($.jade({
      // locals: YOUR_LOCALS
      pretty: true // 不被壓縮
    }))
    .pipe(gulp.dest('./public/'))
    .pipe(browserSync.stream());
});

gulp.task('sass', function () {
  return gulp.src('./source/scss/**/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    // 這裡 CSS已經編譯完成
    .pipe($.postcss([autoprefixer()])) // 直接引入 autoprefixer
    .pipe($.if(options.env === 'production',$.cleanCss()))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/css'))
    .pipe(browserSync.stream());
});

gulp.task('babel', () =>
  gulp.src('./source/js/**/*.js')
    .pipe($.sourcemaps.init())
    .pipe($.babel({
        presets: ['@babel/env']
    }))
    .pipe($.concat('all.js'))
    .pipe($.if(options.env === 'production',$.uglify({
      compress: {
        drop_console: true
      }
    })))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/js'))
    .pipe(browserSync.stream())
);

gulp.task('bower', function() {
    return gulp.src(mainBowerFiles({
      "overrides": {
          "vue": {                       // 套件名稱
              "main": "dist/vue.js"      // 取用的資料夾路徑
          }
      }
    }))
        .pipe(gulp.dest('./.tmp/vendors'))
});

gulp.task('vendorJs', function() {
  return gulp.src('./.tmp/vendors/**/**.js')
    .pipe($.order([
      'jquery.js',
      'bootstrap.js'
    ]))
    .pipe($.concat('vendors.js'))
    .pipe( $.if(options.env === 'production',$.uglify()))
    .pipe(gulp.dest('./public/js'))
});
gulp.task('image-min', () =>
  gulp.src('./source/images/*')
  .pipe($.if(options.env === 'production',$.imagemin()))
  .pipe(gulp.dest('./public/images'))
);

// gulp.task('browser-sync', function() {
//   browserSync.init({
//       server: {
//           baseDir: "./public"
//       },
//       reloadDebounce: 2000
//   });
// });

// gulp.task('watch', function () {
//   gulp.watch('./source/scss/**/*.scss', gulp.series('sass'));
//   gulp.watch('./source/**/*.jade', gulp.series('jade'));
//   gulp.watch('./source/js/**/*.js', gulp.series('babel'));
// });
// gulp 4.0所修改

gulp.task('deploy', function() {
  return gulp.src('./public/**/*')
    .pipe($.ghPages());
});


// gulp.task('build', gulpSequence('clean','jade', 'sass', 'babel', 'vendorJs');

// gulp.task('default', gulp.parallel('jade', 'sass', 'babel',gulp.series('bower', 'vendorJs'), 'browser-sync', 'watch'));
// 以series順序執行bower vendors

gulp.task('build',
  gulp.series(
    'clean',
    'bower',
    'vendorJs',
    gulp.parallel('jade', 'sass', 'babel','image-min')
  )
)
gulp.task('default',
  gulp.series(
    'clean',
    'bower',
    'vendorJs',
    gulp.parallel('jade', 'sass', 'babel'),
    function(done) {
      browserSync.init({
        server: {
            baseDic: './public'
        },
        reloadDebounce: 2000
    })
      gulp.watch('./source/scss/**/*.scss', gulp.series('sass'));
      gulp.watch('./source/**/*.jade', gulp.series('jade'));
      gulp.watch('./source/js/**/*.js', gulp.series('babel'));
      done();
    }
  )
)