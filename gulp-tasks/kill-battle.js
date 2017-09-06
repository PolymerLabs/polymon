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

const battleId = process.argv[2];
const envJsonPath = path.resolve(__dirname, '../.active.env.json');
const serviceAccountJsonPath = path.resolve(__dirname, '../.active.service-account.json');
const serviceAccount = require(serviceAccountJsonPath);

console.log('Killing battle:', battleId);

readJson(envJsonPath).then(config => {
  const app = firebaseAdmin.initializeApp({
    databaseURL: config.firebase.databaseURL,
    credential: firebaseAdmin.credential.cert(serviceAccount)
  });

  const db = app.database();

  return db.ref(`/battles/${battleId}`).once('value')
      .then(snapshot => snapshot.val())
      .then(battle => {
        let initiatingUserId = battle.initiatingUserId;
        let defendingUserId = battle.defendingUserId;

        console.log('Resetting active battle for users', initiatingUserId, defendingUserId);

        return Promise.all([
          initiatingUserId
              ? db.ref(`/users/${initiatingUserId}/player/activeBattleId`).set(null)
              : Promise.resolve(),
          defendingUserId
              ? db.ref(`/users/${defendingUserId}/player/activeBattleId`).set(null)
              : Promise.resolve()
        ]);
      })
      .catch(e => console.error(e))
      .then(() => process.exit(0));
});
