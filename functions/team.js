exports.ensureCorrectTeamSize = function(db, userId) {
  return db.ref(`/users/${userId}/team`)
      .once('value')
      .then(snapshot => snapshot.val())
      .then(team => {
        let count = Object.keys(team);

        console.log(`User ${userId} has a team with ${count} Polymon..`);

        if (count < 3) {
          throw new Error(`Team size not big enough (${count}).`);
        }

        if (count > 5) {
          throw new Error(`Team is too big (${count}).`);
        }
      });
};

exports.validateTeam = functions => functions
    .database()
    .path('/users/{userId}/team/{teamId}')
    .on('write', event => {
      const newTeamPositionId = event.data.key;
      const newTeamPosition = event.data.val();
      const teamRef = event.data.ref.parent;

      if (newTeamPosition == null) {
        console.log('No new team position, ignoring..');
        return null;
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
