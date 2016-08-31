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
        let count = Object.keys(team).length;

        console.log(`User ${userId} has a team with ${count} Polymon..`);

        if (count < 3) {
          throw new Error(`Team size not big enough (${count}).`);
        }

        if (count > 5) {
          throw new Error(`Team is too big (${count}).`);
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
