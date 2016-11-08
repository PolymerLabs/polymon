/**
 * Generates the following "tables" in Firebase:
 *  1. An index-readable map of Firebase keys to Polymon resources.
 *  2. A non-index-readable map of Polymon references to Polymon Firebase keys.
 *
 * Generates the following static files:
 *  1. qr-code-data.json, a file mapping references to Polymon resources.
 */

const common = require('./_common');
const readJson = require('then-read-json');
const writeJson = require('then-write-json');

common.getPolymonEnv().then(polymon => {
  const initialBounds = {
    northEast: {
      lat: 37.881054,
      lng: -122.298045
    },

    southWest: {
      lat: 37.808696,
      lng: -122.219086
    }
  };

  function randomSighting() {
    const {northEast, southWest} = initialBounds;
    return {
      lat: Math.random() * (northEast.lat - southWest.lat) + southWest.lat,
      lng: Math.random() * (southWest.lng - northEast.lng) + northEast.lng,
      timestamp: Date.now()
    };
  }

  const app = polymon.firebaseApp;
  const projectId = polymon.config.firebase.projectId;
  const secret = polymon.secret;
  const db = app.database();

  const polymonsRef = db.ref('/polymons');
  const referencesRef = db.ref('/references');

  console.log(`Generating seed data for ${projectId}...`);

  return common.cleanEverything().then(() => {
    return readJson(common.polymonJsonPath).then(polymons => {
      let writes = [];
      polymons = polymons.map((polymon, index) => {
        polymon = Object.assign({
          lastSeen: randomSighting(),
          shortName: polymon.shortName || polymon.name.toLowerCase(),
          spriteIndex: index
        }, polymon);

        let reference = common.makeReference(polymon);
        let polymonRef = polymonsRef.push(polymon);
        let referenceSet = referencesRef.child(reference).set(polymonRef.key);

        writes.push(polymonRef, referenceSet);

        return {
          reference,
          polymon
        };
      });

      let qrCodeData = {
        projectId,
        polymons
      };

      writes.push(writeJson(common.qrCodeDataPath, qrCodeData))

      return Promise.all(writes);
    }).then(() => console.log('Seed data created successfully.'));
  }).catch(error => {
    console.error(error);
  }).then(() => {
    console.log('Done!');
    process.exit();
  });
});
