const readJson = require('then-read-json');
const fs = require('fs');
const argv = require('yargs').argv;
const confirm = require('positive');
const __spawn = require('child_process').spawn;
const __exec = require('child_process').exec;
const buildDestination = './build';

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

const exec = (cmd) => {
  let res;

  const promisifed = new Promise((resolve) => {
    res = resolve;
  });

  const child = __exec(cmd);

  child.on('data', data => console.log(data))
  child.on('close', code => res(code));

  return promisifed;
};

const generateFirebaseConfig = hostingFolder => {
  console.log('generating firebase.json...');
  let res;

  const generateFirebase = new Promise((resolve) => {
    res = resolve;
  });

  readJson('./firebaseConfig.json').then(firebaseConfig => {
    firebaseConfig.hosting.public = hostingFolder;

    const firebaseJson = JSON.stringify(firebaseConfig, null, 2) + '\n';

    fs.writeFile('./firebase.json', firebaseJson, _ => {
      console.log('firebase.json generated.');
      res()
    });
  });

  return generateFirebase;
};

const setEnv = async (env='dev') => {
  const environment = argv.env || env;
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
};

const generateIndex = async (env='dev') => {
  await setEnv(env);
  await require('./generate-index.js').generate();
}

const install = async _ => {
  console.log('installing dependencies...');

  await Promise.all([
    exec('npm install ./functions --prefix ./functions'),
    exec('bower install')
  ]);

  console.log('dependencies installed!');
};

const deployFunctionsDatabase = async (hostingFolder='build') => {
  await install();
  await generateFirebaseConfig(hostingFolder);

  console.log('deploying firebase functions...');
  await exec('firebase deploy --only functions,database');
  console.log('firebase functions deployed.');
};

const deployHosting = async (env='dev', hostingFolder='build') => {
  await Promise.all([
    build(env),
    generateFirebaseConfig(hostingFolder)
  ]);

  console.log('deploying hosting...');
  await exec('node ./scripts/update-firebase-env.js');
  await exec('firebase deploy --only hosting');
  console.log('hosting deployed.');
};

const generateData = async (env='dev') => {
  await setEnv(env);
  await generateFirebaseConfig();

  const confirmed =
      confirm(`Generating data will reset the state of Polymon by deleting a lot of things in your Firebase Project. Are you sure you want to do this? [y/N] `, false);

  await require('./generate-seed-data.js').generate(confirmed);
};

const clean = async _ => {
  console.log('cleaning workspace...');

  await Promise.all([
    exec('rm -rf ./build'),
    exec('rm -rf ./client/bower_components'),
    exec('rm -rf ./functions/node_modules'),
    exec('rm -rf ./firebase.json')
  ]);

  console.log('workspace cleaned!');
};

const serve = async (hostingFolder='client') => {
  await generateFirebaseConfig(hostingFolder);
  await spawn('firebase serve', true);
};

const build = async (env='dev') => {
  await Promise.all([
    generateIndex(env),
    install()
  ]);

  console.log('building polymon...');
  await exec('cd client && polymer build && cd ..');
  console.log('polymon built, cleaning up...');
  await exec(`cp -R ./client/build/bundled/ ${buildDestination}`);
  await exec('rm -rf ./client/build');
  console.log('build files cleaned up!');
};

const deployAll = async (env='dev', hostingFolder='build') => {
  await deployFunctionsDatabase(hostingFolder);
  await deployHosting(env, hostingFolder);
};

const quickStart = async _ => {
  await clean();
  await generateData();
  await deployAll();
  await serve();
};

module.exports = {
  build: build,
  clean: clean,
  deployAll: deployAll,
  deployFunctionsDatabase: deployFunctionsDatabase,
  deployHosting: deployHosting,
  generateData: generateData,
  install: install,
  quickStart: quickStart,
  serve: serve
}