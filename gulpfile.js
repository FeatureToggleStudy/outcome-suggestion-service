const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const ts = require('gulp-typescript');
const watch = require('gulp-watch');
const JSON_FILES = ['package.json', 'src/*.json', 'src/**/*.json'];

const BUSINESS_CARD_TEMPLATE = ['src/business-cards/businesscardformempty.pdf'];

// pull in the project TypeScript config
const tsProject = ts.createProject('tsconfig.json');

gulp.task('tsc', () => {
  const tsResult = tsProject.src().pipe(tsProject());
  return tsResult.js.pipe(gulp.dest('dist'));
});

gulp.task('watch', ['tsc'], () => {
  watch('src/**/*.ts', { usePolling: true, interval: 2000 }, function(file) {
    gulp.start('tsc')
  });
});

gulp.task('assets', function() {
  gulp.src([...JSON_FILES, ...BUSINESS_CARD_TEMPLATE]).pipe(gulp.dest('dist'));
});

gulp.task('start', ['watch'], function() {
  inDocker = process.env.IN_DOCKER == 'true';
  
  nodemon({
    script: 'dist/app.js',
    ext: 'js html',
    watch: ['./dist'],
    legacyWatch: inDocker,
    delay: 5
  });
});

gulp.task('default', ['watch', 'assets']);
