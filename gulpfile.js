const gulp = require('gulp');
const gulpif = require('gulp-if');
const uglify = require('gulp-uglify');
const babili = require('gulp-babili');
const mergeStream = require('merge-stream');
const cssSlam = require('css-slam').gulp;
const htmlMinifier = require('gulp-html-minifier');
const debug = require('gulp-debug');
const {
	HtmlSplitter,
  PolymerProject
} = require('polymer-build');

const buildDestination = './build';

const staticAssets = [
  'client/fonts/**/*',
  'client/images/**/*',
  'client/music/**/*',
  'client/manifest.json',
  'client/bower_components/webrtc-polyfill/index.js',
  'client/bower_components/webcomponentsjs/webcomponents-lite.min.js'
];

gulp.task('polymer-build', () => {
	const project = new PolymerProject(require('./polymer.json'));
	const sourcesHtmlSplitter = new HtmlSplitter();

  const compressHtml = stream => stream
      .pipe(sourcesHtmlSplitter.split())
      //.pipe(gulpif(/\.js$/, babili()))
      //.pipe(gulpif(/\.css$/, cssSlam()))
      //.pipe(gulpif(/\.html$/, htmlMinifier()))
      .pipe(gulpif(/\.js$/, debug({ title: 'js:' })))
      .pipe(gulpif(/\.css$/, debug({ title: 'css:' })))
      .pipe(gulpif(/\.html$/, debug({ title: 'html:' })))
      .pipe(sourcesHtmlSplitter.rejoin());

  const compressProject = project => mergeStream(
      compressHtml(project.sources()),
      compressHtml(project.dependencies()));

  return compressProject(project)
      //.pipe(project.bundler)
      .pipe(gulp.dest(buildDestination));
});

gulp.task('copy-static', () => {
  return gulp.src(staticAssets, { base: '.' })
    .pipe(gulp.dest(buildDestination));
});

gulp.task('default', ['polymer-build', 'copy-static']);
