const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const ts = require('gulp-typescript');
const JSON_FILES = ['package.json', 'src/*.json', 'src/**/*.json'];

const BUSINESS_CARD_TEMPLATE = ['src/business-cards/businesscardformempty.pdf'];

// pull in the project TypeScript config
const tsProject = ts.createProject('tsconfig.json');

gulp.task('tsc', () => {
  const tsResult = tsProject.src().pipe(tsProject());
  return tsResult.js.pipe(gulp.dest('dist'));
});

gulp.task('watch', ['tsc'], () => {
  gulp.watch('src/**/*.ts', ['tsc']);
});

gulp.task('assets', function() {
  gulp.src([...JSON_FILES, ...BUSINESS_CARD_TEMPLATE]).pipe(gulp.dest('dist'));
});

gulp.task('start', ['watch', 'assets'], function() {
  nodemon({
    script: 'dist/app.js',
    ext: 'js',
    watch: ['./dist'],
  });
});

gulp.task('default', ['watch', 'assets']);
