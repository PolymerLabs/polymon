/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

const gulp = require('gulp');
const readJson = require('then-read-json');
const argv = require('yargs').argv;
const tasks = require('./gulp-tasks/task-helpers.js');

gulp.task('clean', async _ => tasks.clean());
gulp.task('install', async _ => tasks.install());

gulp.task('gen-data', async _ => tasks.generateData());
gulp.task('gen-data:dev', async _ => tasks.generateData('dev'));
gulp.task('gen-data:prod', async _ => tasks.generateData('prod'));

gulp.task('update-polymons', async _ => tasks.updatePolymons());
gulp.task('update-polymons:dev', async _ => tasks.updatePolymons('dev'));
gulp.task('update-polymons:prod', async _ => tasks.updatePolymons('prod'));

gulp.task('deploy:all', async _ => tasks.deployAll());
gulp.task('deploy:all:dev', async _ => tasks.deployAll('dev'));
gulp.task('deploy:all:prod', async _ => tasks.deployAll('prod'));
gulp.task('deploy:all:dev:debug', async _ => tasks.deployAll('dev', 'client'));
gulp.task('deploy:all:prod:debug', async _ => tasks.deployAll('prod', 'client'));

gulp.task('build', async _ => tasks.build());
gulp.task('build:dev', async _ => tasks.build('dev'));
gulp.task('build:prod', async _ => tasks.build('prod'));

gulp.task('serve', async _ => tasks.serve());
gulp.task('serve:compiled', async _ => tasks.serve('build'));

gulp.task('deploy:hosting', async _ => tasks.deployHosting());
gulp.task('deploy:hosting:dev', async _ => tasks.deployHosting('dev'));
gulp.task('deploy:hosting:prod', async _ => tasks.deployHosting('prod'));
gulp.task('deploy:hosting:debug', async _ => tasks.deployHosting('dev', 'client'));
gulp.task('deploy:hosting:dev:debug', async _ => tasks.deployHosting('dev', 'client'));
gulp.task('deploy:hosting:prod:debug', async _ => tasks.deployHosting('prod', 'client'));

gulp.task('deploy:functions', async _ => tasks.deployFunctionsDatabase());
gulp.task('deploy:functions:dev', async _ => tasks.deployFunctionsDatabase('dev'));
gulp.task('deploy:functions:prod', async _ => tasks.deployFunctionsDatabase('prod'));

gulp.task('unlock-polydex', async _ => {
  await tasks.unlockPolydex(argv.uid);
  console.log('Finished \'unlock-polydex\'');
});
gulp.task('unlock-polydex:dev', async _ => {
  await tasks.unlockPolydex(argv.uid, 'dev');
  console.log('Finished \'unlock-polydex\'');
});
gulp.task('unlock-polydex:prod', async _ => {
  await tasks.unlockPolydex(argv.uid, 'prod');
  console.log('Finished \'unlock-polydex\'');
});

gulp.task ('default', async _ => tasks.quickStart());
