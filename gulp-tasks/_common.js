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
const del = require('del');
const SHA256 = require('crypto-js/sha256');
const firebaseAdmin = require('firebase-admin');
const firebaseConfigstore = require('firebase-tools/lib/configstore');
const firebaseDetectProjectRoot = require('firebase-tools/lib/detectProjectRoot');
const firebaseLoadRCFile = require('firebase-tools/lib/loadRCFile.js');
const qrCodeDataPath =
    path.resolve(__dirname, '../client/qr-code-data.json');
const polymonJsonPath = path.resolve(__dirname, '../polymon.json');
const serviceAccountJsonPath =
    path.resolve(__dirname, '../.active.service-account.json');
const serviceAccount = require(serviceAccountJsonPath);
const envJsonPath = path.resolve(__dirname, '../.active.env.json');
const secret = process.env.POLYMON_SECRET || 'NO_SECRET_SPECIFIED';

let polymonEnvResolves = null;

console.log(`Polymon secret: ${secret}`);

function makeReference(polymon) {
  return SHA256(`${polymon.shortName}${secret}`).toString();
}

function getActiveFirebaseProject() {
  const projectDir = firebaseDetectProjectRoot();
  const activeProjects = firebaseConfigstore.get('activeProjects');
  const firebaseRc = firebaseLoadRCFile();

  if (projectDir != null
      && activeProjects != null
      && activeProjects[projectDir] != null) {
    const alias = activeProjects[projectDir];

    if (firebaseRc != null
        && firebaseRc.projects != null
        && firebaseRc.projects[alias] != null) {
      return firebaseRc.projects[alias];
    }

    return alias;
  } else {
    throw new Error('Unable to detect active Firebase project.');
  }
}

function getPolymonEnv() {
  if (polymonEnvResolves == null) {
    polymonEnvResolves = readJson(envJsonPath).then(config => {
      config.firebase = Object.assign(config.firebase, {
        projectId: getActiveFirebaseProject()
      });

      return {
        config,
        secret,
        firebaseApp: firebaseAdmin.initializeApp({
          databaseURL: config.firebase.databaseURL,
          credential: firebaseAdmin.credential.cert(serviceAccount)
        })
      };
    });
  }

  return polymonEnvResolves;
}

function cleanEverything() {
  return getPolymonEnv().then(polymon => {
    const db = polymon.firebaseApp.database();
    const polymonsRef = db.ref('/polymons');
    const referencesRef = db.ref('/references');
    const usersRef = db.ref('/users');

    return Promise.all([
      del([qrCodeDataPath]),
      polymonsRef.remove(),
      referencesRef.remove(),
      usersRef.remove()
    ]);
  });
}

module.exports = exports = {
  makeReference,
  getPolymonEnv,
  cleanEverything,
  qrCodeDataPath,
  polymonJsonPath,
  serviceAccountJsonPath,
  envJsonPath
};
