const team = require('./team');

function ensureNoActiveBattle(db, userId) {
  return db.ref(`/users/${userId}/player/activeBattleId`)
      .once('value')
      .then(snapshot => snapshot.val())
      .then(activeBattleId => {
        if (activeBattleId != null) {
          throw new Error(`User ${userId} already has an Active Battle ID: ${activeBattleId}`);
        }
      });
}

function initiateBattle(db, userId, battleRequest) {
  return ensureNoActiveBattle(db, userId)
      .then(() => team.ensureCorrectTeamSize(db, userId))
      .then(() => db.ref('/battles').push({
        createdAt: Date.now(),
        initiatingUserId: userId,
        initiatingUserHeartbeat: battleRequest.createdAt
      }))
      .then(snapshot => snapshot.key)
      .then(battleId => {

        console.log(`Initiating User ID: ${userId}`);
        console.log(`Battle ID: ${battleId}`);

        return db.ref(`/users/${userId}/player/activeBattleId`).set(battleId)
      });

}

function joinBattle(db, userId, battleRequest) {
  return ensureNoActiveBattle(db, userId)
      .then(() => team.ensureCorrectTeamSize(db, userId))
      .then(() => db.ref(`/battles/${battleRequest.battleId}`))
      .then(battleRef =>  battleRef.once('value').then(snapshot => {
            if (!snapshot.exists()) {
              throw new Error(`No such Battle found: ${battleId}..`);
            }

            const battle = snapshot.val();

            if (battle.finishedAt != null) {
              throw new Error(`Battle ${battleId} already finished!`);
            }

            if (battle.startedAt != null) {
              throw new Error(`Battle ${battleId} already in progress!`);
            }

            console.log(`Defending User ID: ${userId}`);
            console.log(`Battle ID: ${battleRequest.battleId}`);

            return Promise.all([
              db.ref(`/users/${userId}/player/activeBattleId`)
                  .set(battleRequest.battleId),
              battleRef.child('defendingUserId').set(userId),
              battleRef.child('defendingUserHeartbeat')
                  .set(battleRequest.createdAt),
              battleRef.child('startedAt').set(Date.now())
            ]);
          }));
}


exports.processBattleQueue = functions => functions
    .database()
    .path('/users/{userId}/battleQueue/{battleRequestId}')
    .on('write', event => {
      const battleRequest = event.data.val();
      const userId = event.params.userId;
      const db = functions.app.database();

      if (battleRequest == null) {
        console.log('No Battle Request, ignoring..');
        return null;
      }

      console.log(`Battle Request Created At: ${battleRequest.createdAt}`);
      console.log(`Battle Request Action: ${battleRequest.action}`);

      let action;

      switch (battleRequest.action) {
        case 'initiate':
          action = initiateBattle(db, userId, battleRequest);
          break;
        case 'join':
          action = joinBattle(db, userId, battleRequest);
          break;
        default:
          action = Promise.resolve();
      }

      return action
          .catch(error => console.error(error))
          .then(() => event.data.ref.remove());
    });
