/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

const path = require('path');

const readJson = require('then-read-json');
const firebaseAdmin = require('firebase-admin');

const polymonJsonPath = path.resolve(__dirname, '../polymon.json');
const envJsonPath = path.resolve(__dirname, '../.active.env.json');
const serviceAccountJsonPath = path.resolve(__dirname, '../.active.service-account.json');
const serviceAccount = require(serviceAccountJsonPath);

Promise.all([
  readJson(envJsonPath),
  readJson(polymonJsonPath)
]).then(results => {
  const [config, polymons] = results;
  const app = firebaseAdmin.initializeApp({
    databaseURL: config.firebase.databaseURL,
    credential: firebaseAdmin.credential.cert(serviceAccount)
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
