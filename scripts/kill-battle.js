const path = require('path');

const readJson = require('then-read-json');
const firebase = require('firebase');

const battleId = process.argv[2];
const envJsonPath = path.resolve(__dirname, '../.active.env.json');
const serviceAccountJsonPath = path.resolve(__dirname, '../.active.service-account.json');

console.log('Killing battle:', battleId);

readJson(envJsonPath).then(config => {
  const app = firebase.initializeApp({
    name: config.firebase.appName,
    apiKey: config.firebase.apiKey,
    databaseURL: config.firebase.databaseUrl,
    serviceAccount: serviceAccountJsonPath
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
