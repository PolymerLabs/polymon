const path = require('path');
const gulp = require('gulp');
const readJson = require('then-read-json');
const fs = require('fs');
const argv = require('yargs').argv;
const confirm = require('positive');
const __spawn = require('child_process').spawn;
const __exec = require('child_process').exec;
const spawn = (cmd, stdout) => {
  let res;

  const promisifed = new Promise((resolve) => {
    res = resolve;
  });

  const args = cmd.split(' ');

  const child = __spawn(args.shift(), args);

  if (stdout) {
    child.stdout.on('data', data => {
      console.log(data.toString());
    });

  }

  child.stderr.on('data', data => {
    console.error(data.toString());
  });

  child.on('exit', code => {
    console.log(code);
    res(code.toString());
  });

  return promisifed;
};
const exec = (cmd, stdout) => {
  let res;

  const promisifed = new Promise((resolve) => {
    res = resolve;
  });

  const child = __exec(cmd);

  child.on('data', data => console.log(data))
  child.on('close', code => res(code));

  return promisifed;
};

const buildDestination = './build';
let forceEnv = '';
let forceDeploy = false;
let forceGenerateData = false;
let firebasePublicTarget = 'build';

const generateFirebaseConfig = () => {
  console.log('generating firebase.json...');
  let res;

  const generateFirebase = new Promise((resolve) => {
    res = resolve;
  });

  readJson('./firebaseConfig.json').then(firebaseConfig => {
    firebaseConfig.hosting.public = firebasePublicTarget;

    const firebaseJson = JSON.stringify(firebaseConfig, null, 2) + '\n';

    fs.writeFile('./firebase.json', firebaseJson, _ => {
      console.log('firebase.json generated.');
      res()
    });
  });

  return generateFirebase;
}

gulp.task('generate-firebase-config', generateFirebaseConfig)

gulp.task('clean', async () => {
  console.log('cleaning workspace...');
  return Promise.all([
    exec('rm -rf ./build'),
    exec('rm -rf ./client/bower_components'),
    exec('rm -rf ./functions/node_modules'),
    exec('rm -rf ./firebase.json')
  ]);
  console.log('workspace cleaned!');
});

gulp.task('install', async () => {
  console.log('installing dependencies...');
  await Promise.all([
    exec('npm install ./functions --prefix ./functions'),
    exec('bower install')
  ]);
  console.log('dependencies installed!');
});

gulp.task('deploy-functions-database', ['install', 'generate-firebase-config'], async () => {
  console.log('deploying firebase functions...');
  await exec('firebase deploy --only functions,database');
  console.log('firebase functions deployed.');
});

gulp.task('serve', async () => {
  if (argv.compiled != true && argv.compiled != 'true') {
    firebasePublicTarget = 'client';
  }

  await generateFirebaseConfig();
  await spawn('firebase serve', true);
});

gulp.task('deploy-flag', ['build', 'deploy-functions-database', 'generate-firebase-config'], async () => {

  if (forceDeploy || argv.deploy == true || argv.deploy == 'true') {
    forceDeploy = false;
    console.log('deploying hosting...');
    await exec('node ./scripts/update-firebase-env.js');
    await exec('firebase deploy --only hosting -p ./build');
    console.log('hosting deployed.');
  }
});

gulp.task('deploy', () => {
  forceDeploy = true;
  gulp.start('deploy-flag');
});

gulp.task('dev', () => {
  console.log('forcing dev...');
  forceEnv = 'dev';
});

gulp.task('prod', () => {
  console.log('forcing prod...');
  forceEnv = 'prod';
});

gulp.task('set-env', async () => {
  const environment = forceEnv || (argv.env ? argv.env : 'dev');
  forceEnv = '';
  const missingEnv = await exec(`ls -a | grep .${environment}.env.json`, true) == '1';
  const missingServiceAcct = await exec(`ls -a | grep .${environment}.service-account.json`, true) == '1';

  if (missingEnv || missingServiceAcct) {
    let error = 'You are missing the following file(s):';

    if (missingEnv) {
      error += `\n\t.${environment}.env.json`;
    }

    if (missingServiceAcct) {
      error += `\n\t.${environment}.service-account.json`
    }

    throw new Error(error);
  }

  console.log(`Setting environment to ${environment}...`);

  await Promise.all([
    exec(`ln -fs ./.${environment}.env.json ./.active.env.json`),
    exec(`ln -fs ./.${environment}.service-account.json ./.active.service-account.json`)
  ]);

  console.log('environment set!');
});

gulp.task('generate-data', () => {
  forceGenerateData = true;
  gulp.start('generate-data-flag');
});

gulp.task('generate-data-flag', ['set-env'], () => {
  if (forceGenerateData || argv.genData == true || argv.genData == 'true') {
    forceGenerateData = false;

    const confirmed =
        confirm(`This action will reset the state of Polymon by deleting a lot of things. Are you sure you want to do this? [y/N] `, false);

    return require('./scripts/generate-seed-data.js').generate(confirmed);
  }
});

gulp.task('generate-index', ['set-env'], () => {
  return require('./scripts/generate-index.js').generate();
});

gulp.task('build', ['generate-index', 'install'], async () => {
  console.log('building polymon...');
  await exec('cd client && polymer build && cd ..');
  console.log('polymon built, cleaning up...');
  await exec(`cp -R ./client/build/bundled ${buildDestination}`);
  await exec('rm -rf ./client/build');
  console.log('build files cleaned up!');
});

gulp.task('init', ['clean', 'install']);
gulp.task('default', ['init', 'generate-data-flag', 'build', 'deploy-flag']);