const path = require('path');
const gulp = require('gulp');
const readJson = require('then-read-json');
const writeJson = require('then-write-json');
const argv = require('yargs').argv;
const confirm = require('positive');
const __exec = require('child_process').exec;
const exec = cmd => {
  const child = __exec(cmd);

  return new Promise((res, rej) => {
    child.addListener('error', rej);
    child.addListener('exit', res);
  });
};

const buildDestination = './build';

gulp.task('clean', () => {
  return Promise.all ([
    exec('rm -rf ./build'),
    exec('rm -rf ./client/bower_components'),
    exec('rm -rf ./functions/node_modules')
  ]);
});

gulp.task('install', () => {
  return Promise.all([
    exec('npm install ./functions --prefix ./functions'),
    exec('bower install')
  ])
});

gulp.task('deploy-functions-database', ['install'], () => {
  if (!argv.skipFunctions == true || !argv.skipFunctions == 'true') {
    return exec('firebase deploy --only functions,database');
  }
});

gulp.task('deploy', ['build', 'deploy-functions-database'], async (done) => {
  if (argv.deploy == true || argv.deploy == 'true') {
    await exec('node ./scripts/update-firebase-env.js');
    await exec('firebase deploy --only hosting -p ./build');
  }
});

gulp.task('deploy-current', async (done) => {
  await exec('node ./scripts/update-firebase-env.js');
  await exec('firebase deploy --only hosting -p build/');
});

gulp.task('set-env', () => {
  const environment = argv.env ? argv.env : 'dev';

  return Promise.all([
    exec(`ln -fs ./.${environment}.env.json ./.active.env.json`),
    exec(`ln -fs ./.${environment}.service-account.json ./.active.service-account.json`)
  ]);
});

gulp.task('generate-data', ['set-env'], () => {
  if (argv.genData == true || argv.genData == 'true') {
    const confirmed =
        confirm(`This action will reset the state of Polymon by deleting a lot of things. Are you sure you want to do this? [y/N] `, false);

    return require('./scripts/generate-seed-data.js').generate(confirmed);
  }
});

gulp.task('generate-index', ['set-env'], () => {
  return require('./scripts/generate-index.js').generate();
});

gulp.task('build', ['generate-index', 'install'], async () => {
  await exec('cd client && polymer build && cd ..');
  await exec(`cp -R ./client/build/bundled ${buildDestination}`);
  await exec('rm -rf ./client/build');
});

gulp.task('init', ['clean', 'install']);
gulp.task('default', ['init', 'generate-data', 'build', 'deploy']);