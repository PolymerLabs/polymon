const gulp = require('gulp');
const readJson = require('then-read-json');
const tasks = require('./gulp-tasks/task-helpers.js');

gulp.task('clean', async _ => { await tasks.clean() });
gulp.task('install', async _ => { await tasks.install() });

gulp.task('gen-data', async _ => { await tasks.generateData() });
gulp.task('gen-data:dev', async _ => { await tasks.generateData('dev') });
gulp.task('gen-data:prod', async _ => { await tasks.generateData('prod') });

gulp.task('deploy:all', async _ => { await tasks.deployAll() });
gulp.task('deploy:all:dev', async _ => { await tasks.deployAll('dev') });
gulp.task('deploy:all:prod', async _ => { await tasks.deployAll('prod') });
gulp.task('deploy:all:dev:source', async _ => { await tasks.deployAll('dev', 'client') });
gulp.task('deploy:all:prod:source', async _ => { await tasks.deployAll('prod', 'client') });

gulp.task('build', async _ => { await tasks.build() });
gulp.task('build:dev', async _ => { await tasks.build('dev') });
gulp.task('build:prod', async _ => { await tasks.build('prod') });

gulp.task('serve', async _ => { await tasks.serve() });
gulp.task('serve:compiled', async _ => { await tasks.serve('build') });

gulp.task('deploy:hosting', async _ => { await tasks.deployHosting() });
gulp.task('deploy:hosting:dev', async _ => { await tasks.deployHosting('dev') });
gulp.task('deploy:hosting:prod', async _ => { await tasks.deployHosting('prod') });
gulp.task('deploy:hosting:source', async _ => { await tasks.deployHosting(null, 'client') });
gulp.task('deploy:hosting:dev:source', async _ => { await tasks.deployHosting('dev', 'client') });
gulp.task('deploy:hosting:prod:source', async _ => { await tasks.deployHosting('prod', 'client') });

gulp.task('deploy:functions', async _ => { await tasks.deployFunctionsDatabase() });
gulp.task('deploy:functions:dev', async _ => { await tasks.deployFunctionsDatabase('dev') });
gulp.task('deploy:functions:prod', async _ => { await tasks.deployFunctionsDatabase('prod') });

gulp.task ('default', async _ => { await tasks.quickStart(); });