/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

const {
  ensureNoActiveBattle,
  getUserPolymon,
  userErrorNotifier
} = require('./common');

exports.modifyTeam = (functions, admin) => functions.database
    .ref('/users/{userId}/teamQueue/{messageId}')
    .onWrite(event => {
      const messageId = event.data.key;
      const message = event.data.val();
      const userId = event.params.userId;

      if (message == null) {
        console.log('No Team message, ignoring...');
        return null;
      }

      const { polydexId, index } = message;
      const db = admin.database();
      const teamRef = db.ref(`/users/${userId}/team`);

      console.log(`User ID: ${userId}`);
      console.log(`Polydex ID: ${polydexId}`);
      console.log(`Target team position: ${index}`);

      return ensureNoActiveBattle(db, userId)
        .then(() => Promise.all([
          teamRef.once('value'),
          db.ref(`/users/${userId}/polydex/${polydexId}`).once('value')
        ]))
        .then(snapshots => snapshots.map(snapshot => snapshot.val()))
        .then(results => {
          const [ team, polydexEntry ] = results;
          const changes = [];

          if (polydexEntry == null) {
            console.log(`User ${userId} has no Polydex Entry ${polydexId}!`);
            throw new Error(`Polymon hasn't been caught yet.`);
          }

          const { polymonId } = polydexEntry;

          for (let teamPositionId in team) {
            const teamPosition = team[teamPositionId];

            if (teamPosition.index === index ||
                teamPosition.polydexId === polydexId) {
              console.log(`Removing Polydex entry ${teamPosition.polydexId} from team position ${teamPosition.index}.`);
              changes.push(teamRef.child(teamPositionId).remove());
            }
          }

          changes.push(
              db.ref(`/users/${userId}/team`).push({
                index,
                polydexId,
                polymonId
              }));

          return Promise.all(changes);
        })
        .catch(userErrorNotifier(db, userId))
        .then(() => event.data.ref.remove());
    });
