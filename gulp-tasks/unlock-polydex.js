/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

const polymon = require('./_common');

const unlockPolydex = async uid => {
  if (!uid) {
    throw new Error('UID not specified.\n\t\tPlease specify UID with the ' +
        '--uid flag.');
  }

  const env = await polymon.getPolymonEnv();
  const db = env.firebaseApp.database();
  let res, rej;


  const dataSnapshot = await db.ref('/references').once('value');
  const references = dataSnapshot.val();
  const polymonIds = Object.values(references);

  const dbObjects = polymonIds.map(polymonId => {
    return {
      caughtAt: Date.now(),
      catchId: 'admin',
      polymonId: polymonId
    }
  });

  await db.ref(`/users/${uid}/polydex`).set(dbObjects);
  await env.firebaseApp.delete();
}

module.exports = {
  unlockPolydex: unlockPolydex
}
