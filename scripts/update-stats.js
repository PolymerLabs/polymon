const path = require('path');

const readJson = require('then-read-json');
const firebase = require('firebase');

const polymonJsonPath = path.resolve(__dirname, '../polymon.json');
const envJsonPath = path.resolve(__dirname, '../.active.env.json');
const serviceAccountJsonPath = path.resolve(__dirname, '../.active.service-account.json');

Promise.all([
  readJson(envJsonPath),
  readJson(polymonJsonPath)
]).then(results => {
  const [config, polymons] = results;
  const app = firebase.initializeApp({
    name: config.firebase.appName,
    apiKey: config.firebase.apiKey,
    databaseURL: config.firebase.databaseUrl,
    serviceAccount: serviceAccountJsonPath
  });

  const db = app.database();

  db.ref(`/polymons`).once('value').then(snapshot => snapshot.val())
      .then(polymonsObject => {
        let operations = [];

        for (let id in polymonsObject) {
          let name = polymonsObject[id].name;

          for (let i = 0; i < polymons.length; ++i) {
            let polymon = polymons[i];

            if (polymon.name === name) {
              operations.push(db.ref(`/polymons/${id}/stats`).set(polymon.stats));
            }
          }
        }

        return Promise.all(operations);
      })
      .catch(e => console.error(e))
      .then(() => {
        console.log('Stats updated.');
        process.exit(0);
      });
});
