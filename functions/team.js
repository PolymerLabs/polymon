const { ensureNoActiveBattle } = require('./common');

exports.validateTeam = functions => functions
    .database()
    .path('/users/{userId}/team/{teamId}')
    .onWrite(event => {
      const newTeamPositionId = event.data.key;
      const newTeamPosition = event.data.val();
      const teamRef = event.data.ref.parent;
      const userId = event.params.userId;

      if (newTeamPosition == null) {
        console.log('No new team position, ignoring..');
        return null;
      }

      const db = functions.app.database();

      console.log(`User ID: ${userId}`);
      console.log(`Polydex ID: ${newTeamPosition.polydexId}`);
      console.log(`Index: ${newTeamPosition.index}`);

      return ensureNoActiveBattle(db, userId)
        .then(() => teamRef.once('value'))
        .then(snapshot => {
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
        })
        .then(() =>
            db.ref(`/users/${userId}/polydex/${newTeamPosition.polydexId}`)
                .once('value'))
        .then(snapshot => snapshot.val())
        .then(polydexEntry =>
            event.data.ref.child('polymonId').set(polydexEntry.polymonId))
        .catch(error => {
          console.error(error);
          return event.data.ref.remove();
        });
    });
