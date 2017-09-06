/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

/**
 * Checks a user's active battle. If the user has one, throws an error.
 */
exports.ensureNoActiveBattle = function(db, userId) {
  return db.ref(`/users/${userId}/player/activeBattleId`)
      .once('value')
      .then(snapshot => snapshot.val())
      .then(activeBattleId => {
        if (activeBattleId != null) {
          throw new Error(
              `User ${userId} in Battle ${activeBattleId}.`);
        }
      });
};

exports.ensureCorrectTeamSize = function(db, userId) {
  return db.ref(`/users/${userId}/team`)
      .once('value')
      .then(snapshot => snapshot.val())
      .then(team => {
        // There may not be a team if no team spots are filled:
        let count = team
            ? Object.keys(team).length
            : 0;

        console.log(`User ${userId} has a team with ${count} Polymon..`);

        if (count < 3) {
          throw new Error(
              `Team has ${count} Polymon, but needs at least 3.`);
        }

        if (count > 5) {
          throw new Error(
              `Team has ${count} Polymon, but is allowed no more than 5.`);
        }
      });
};

exports.ensureHasPolydexEntry = function(db, userId, polydexId) {
  return db.ref(`/users/${userId}/polydex/${polydexId}`)
      .once('value')
      .then(snapshot => {
        if (!snapshot.exists()) {
          throw new Error(
              `User ${userId} does not have Polydex Entry ${polydexId}.`);
        }
      });
};

exports.getUserPolymon = function(db, userId, polydexId) {
  return db.ref(`/users/${userId}/polydex/${polydexId}`)
      .once('value')
      .then(snapshot => snapshot.val())
      .then(polydexEntry => db.ref(`/polymons/${polydexEntry.polymonId}`)
          .once('value'))
      .then(snapshot => snapshot.val());
};

exports.recordPolymonSighting = function(db, polymonId, latLng) {
  if (latLng == null) {
    console.log(
        `Cannot record sighting of Polymon ${polymonId}; no lat/lng provided.`);
    return Promise.resolve();
  }

  return db.ref(`/polymons/${polymonId}`).once('value')
      .then(snapshot => snapshot.val())
      .then(polymon => {
        if (!polymon) {
          throw new error(`Polymon ${polymonId} does not exist.`);
        }

        return db.ref(`/polymons/${polymonId}/lastSeen`).set({
          lat: latLng.lat,
          lng: latLng.lng,
          timestamp: Date.now()
        });
      });

};

exports.pushNotification = function(db, userId, message, type="message") {
  if (message == null) {
    console.log(`Warning: no message provided for notification. Ignoring..`);
    return Promise.resolve();
  }

  console.log(`Pushing ${type} notification to User ${userId}: "${message}"`);

  return db.ref(`/users/${userId}/notifications`).push({
    type,
    message,
    createdAt: Date.now(),
    acknowledged: false
  });
};

exports.userErrorNotifier = function(db, userId) {
  return function(error) {
    if (error.stack) {
      console.log(error.stack);
    }
    return exports.pushNotification(db, userId, error.message, 'error');
  };
};

exports.wait = function(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};
