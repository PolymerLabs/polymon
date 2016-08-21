const functions = require('firebase-functions');

exports.validateTeam = functions
    .database()
    .path('/users/{userId}/team/{teamId}')
    .on('write', event => {
      const newTeamPositionId = event.data.key;
      const newTeamPosition = event.data.val();
      const teamRef = event.data.ref.parent;

      if (newTeamPosition == null) {
        console.log('No new team position, ignoring..');
        return
      }

      console.log(`Index: ${newTeamPosition.index}`);
      console.log(`Polydex ID: ${newTeamPosition.polydexId}`);

      return teamRef.once('value').then(snapshot => {
        let team = snapshot.val();
        let changes = [];

        for (let teamPositionId in team) {
          if (teamPositionId === newTeamPositionId) {
            continue;
          }

          let teamPosition = team[teamPositionId];

          if (teamPosition.index === newTeamPosition.index ||
              teamPosition.polydexId === newTeamPosition.polydexId) {
            console.log(`Removing Polydex entry ${teamPosition.polydexId} from team position ${teamPosition.index}.`);
            changes.push(teamRef.child(teamPositionId).remove());
          }
        }

        return Promise.all(changes);
      }).then(() => newTeamPosition);
    });

exports.validateCaughtPolymon = functions
    .database()
    .path('/users/{userId}/catchQueue/{catchId}')
    .on('write', event => {
      const userId = event.params.userId;
      const referenceId = event.data.val();
      const catchId = event.data.key;
      const db = functions.app.database();
      const auth = functions.app.auth();
      const referenceRef = db.ref(`/references/${referenceId}`);

      // If we don't have a referenceId, it means this is probably the write
      // performed by the function removing the queued catch event
      if (referenceId == null) {
        console.log('No Reference ID, ignoring..')
        return event.data.val();
      }

      console.log(`Reference ID: ${referenceId}`);
      console.log(`Catch ID: ${catchId}`);
      console.log(`User ID: ${userId}`);

      return referenceRef.once('value').then(snapshot => {
        if (snapshot.exists()) {
          let polymonId = snapshot.val();

          console.log('Polymon ID:', polymonId);

          return db.ref(`/users/${userId}/polydex`)
              .orderByChild('polymonId')
              .once('value').then(snapshot => {
                let polydexEntries = snapshot.val();

                for (var id in polydexEntries) {
                  if (polydexEntries[id].polymonId === polymonId) {
                    console.log(
                        `This Polymon was already caught..`);
                    return;
                  }
                }

                console.log('Recording catch in Polydex.');
                return db.ref(`/users/${userId}/polydex`).push({
                  caughtAt: Date.now(),
                  catchId,
                  polymonId
                });
              });
        }
      }).catch(error => {
        console.error(`Validation: ${error}`);
      }).then(() => event.data.ref.remove());
    });
