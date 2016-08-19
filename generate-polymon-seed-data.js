/**
 * Generates the following "tables" in Firebase:
 *  1. An index-readable map of Firebase keys to Polymon resources.
 *  2. A non-index-readable map of Polymon references to Polymon Firebase keys.
 *
 * Generates the following static files:
 *  1. qr-code-data.json, a file mapping references to Polymon resources.
 */

const readJson = require('then-read-json');
const writeJson = require('then-write-json');
const del = require('del');
const SHA256 = require('crypto-js/sha256');
const firebase = require('firebase');

const secret = process.env.POLYMON_SECRET || 'NO_SECRET_SPECIFIED';
const qrCodeDataPath = './client/qr-code-data.json';
const app = firebase.initializeApp({
  name: 'polymon',
  apiKey: 'AIzaSyD5zoX-HpvOEiV-bEwHaHBCl9Rmnbgw_xk',
  databaseURL: 'https://polymon-b105e.firebaseio.com',
  serviceAccount: 'service-account.json'
});

const db = app.database();
const polymonsRef = db.ref('/polymons');
const referencesRef = db.ref('/references');
const usersRef = db.ref('/users');

function makeReference(polymon) {
  return SHA256(`${polymon.shortName}${secret}`).toString()
}

function clean() {
  return Promise.all([
    del([qrCodeDataPath]),
    polymonsRef.remove(),
    referencesRef.remove(),
    usersRef.remove()
  ]);
}

clean().then(() => {
  return readJson('./polymon.json').then(polymons => {
    let writes = [];
    let qrCodeData = polymons.map(polymon => {
      let reference = makeReference(polymon);
      let polymonRef = polymonsRef.push(polymon);
      let referenceSet = referencesRef.child(reference).set(polymonRef.key);

      writes.push(polymonRef, referenceSet);

      return {
        reference,
        polymon
      };
    });

    writes.push(writeJson(qrCodeDataPath, qrCodeData))

    return Promise.all(writes);
  });
}).catch(error => {
  console.error(error);
}).then(() => {
  process.exit();
});
