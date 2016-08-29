const {
  ensureNoActiveBattle,
  ensureCorrectTeamSize,
  getUserPolymon
} = require('./common');



function randomModifier() {
  return 1 - Math.floor(Math.random() * 3);
}


function compareMoves(moveOne, polymonOne, moveTwo, polymonTwo) {
  const valueOne = polymonOne[moveOne.attributeName] + moveOne.randomModifier;
  const valueTwo = polymonTwo[moveTwo.attributeName] + moveTwo.randomModifier;

  switch (moveOne.attributeName) {
    case 'attack':
      switch (moveTwo.attributeName) {
        case 'attack':
          // Attack -> Attack: 100% of opposing attack damage passes through.
          return valueTwo;
        case 'defend':
          // Attack -> Defend: Attacker always takes 0 damage.
          return 0;
        case 'counter':
          // Attack -> Counter: If counter is greater than attack, attacker
          // receives the difference in damage. Otherwise, attacker takes 0
          // damage.
          return valueTwo > valueOne ? valueTwo - valueOne : 0;
      }
    case 'defend':
      switch (moveTwo.attributeName) {
        case 'attack':
          // Defend -> Attack: Defender receives the difference in damage. This
          // may result in negative damage (healing).
          return valueTwo - valueOne;
        case 'defend':
          // Defend -> Defend: Defender always takes 0 damage.
          return 0;
        case 'counter':
          // Defend -> Counter: Defender always takes 0 damage.
          return 0;
      }
    case 'counter':
      switch (moveTwo.attributeName) {
        case 'attack':
          // Counter -> Attack: Counterer takes all attack damage, unless the
          // counter is greater than the attack. Otherwise, counterer takes 0
          // damage.
          return valueTwo > valueOne ? valueTwo : 0;
        case 'defend':
          // Counter -> Defend: If counter is greater than defend, counterer
          // heals the difference between defend and counter. Otherwise,
          // counterer takes 0 damage.
          return valueOne > valueTwo ? valueTwo - valueOne : 0;
        case 'counter':
          // Counter -> Counter: Counterer always takes 0 damage.
          return 0;
      }
  }
}


/**
 * Looks up the move for the given user, battle and round.
 */
function userMoveForBattleRound(db, userId, battleId, round) {

  console.log(`Looking up User ${userId}'s Move for Battle ${battleId} round ${round}`);

  return db.ref(`/battles/${battleId}/state/${userId}/moves`).once('value')
      .then(snapshot => snapshot.val())
      .then(moves => {
        for (let moveId in moves) {
          if (moves[moveId].index === round) {
            console.log(`Found Move ${moveId}..`);
            return moves[moveId];
          }
        }

        console.log('No Move found!');

        return null;
      });
}


/**
 * Looks up a Battle by ID and checks that it has not finished yet. If it does
 * not exist, or it has already finished, throws an error.
 */
function ensureBattleNotFinished(db, battleId) {
  if (battleId == null) {
    return Promise.reject(
        `Attempt to ensure unfinished battle, but no Battle ID specified!`);
  }

  return db.ref(`/battles/${battleId}`)
      .once('value')
      .then(snapshot => {
        if (!snapshot.exists()) {
          throw new Error(`Battle ${battleId} does not exist.`);
        } else {
          const finishedAt = snapshot.val().finishedAt;

          if (finishedAt != null) {
            throw new Error(
                `Battle ${battleId} already finished at ${finishedAt}.`);
          }
        }
      });
}


/**
 * Looks up a Battle by ID and checks that it has not started yet. If it does
 * not exist, or it has already started, throws an error.
 */
function ensureBattleNotStarted(db, battleId) {
  if (battleId == null) {
    return Promise.reject(
        `Attempt to ensure unstarted battle, but no Battle ID specified!`);
  }

  return db.ref(`/battles/${battleId}`)
      .once('value')
      .then(snapshot => {
        if (!snapshot.exists()) {
          throw new Error(`Battle ${battleId} does not exist.`);
        } else {
          const startedAt = snapshot.val().startedAt;

          if (startedAt != null) {
            throw new Error(
                `Battle ${battleId} already started at ${startedAt}.`);
          }
        }
      });
}


/**
 * Checks a user's active battle. If none exists, or if the current one does not
 * match the provided Battle ID, throws an error.
 */
function ensureHasActiveBattle(db, userId, battleId) {
  if (battleId == null) {
    return Promise.reject(
        `Attempt to ensure active battle, but no Battle ID specified!`);
  }

  return db.ref(`/users/${userId}/player/activeBattleId`)
      .once('value')
      .then(snapshot => snapshot.val())
      .then(activeBattleId => {
        if (battleId !== activeBattleId) {
          throw new Error(
              `User ${userId} is not a part of Battle ${battleId}.`);
        }
      });
}


/**
 * Initiates a new battle, with the provided user set as the initiating user.
 */
function initiateBattle(db, userId) {
  return ensureNoActiveBattle(db, userId)
      .then(() => ensureCorrectTeamSize(db, userId))
      .then(() => db.ref('/battles').push({
        createdAt: Date.now(),
        initiatingUserId: userId,
        state: {
          [userId]: {
            heartbeat: Date.now()
          }
        },
        status: {
          engaged: false
        }
      }))
      .then(snapshot => snapshot.key)
      .then(battleId => {

        console.log(`Initiating User ID: ${userId}`);
        console.log(`Battle ID: ${battleId}`);

        return db.ref(`/users/${userId}/player/activeBattleId`).set(battleId)
      });
}


function assignBattleMaxRounds(db, battleId) {
  return ensureBattleNotStarted(db, battleId)
      .then(() => Promise.all([
        db.ref(`/battles/${battleId}/initiatingUserId`).once('value'),
        db.ref(`/battles/${battleId}/defendingUserId`).once('value'),
      ]))
      .then(snapshots => snapshots.map(snapshot => snapshot.val()))
      .then(userIds => Promise.all([
        db.ref(`/users/${userIds[0]}/team`).once('value'),
        db.ref(`/users/${userIds[1]}/team`).once('value')
      ]))
      .then(teams =>
          Math.max(Object.keys(teams[0]).length, Object.keys(teams[1]).length))
      .then(maxRounds => {
        console.log(`Setting Battle ${battleId} Max Rounds to ${maxRounds}..`);
        return Promise.all([
          db.ref(`/battles/${battleId}/currentRound`).set(0),
          db.ref(`/battles/${battleId}/maxRounds`).set(maxRounds)
        ]);
      });
}


/**
 * Joins an existing battle, with the provided user set as the defending user.
 */
function joinBattle(db, userId, battleId) {
  return ensureNoActiveBattle(db, userId)
      .then(() => ensureCorrectTeamSize(db, userId))
      .then(() => ensureBattleNotStarted(db, battleId))
      .then(() => ensureBattleNotFinished(db, battleId))
      .then(() => {
        console.log(`Defending User ID: ${userId}`);
        console.log(`Battle ID: ${battleId}`);

        return Promise.all([
          db.ref(`/users/${userId}/player/activeBattleId`).set(battleId),
          db.ref(`/battles/${battleId}/defendingUserId`).set(userId),
          recordHeartbeat(db, userId, battleId)
        ]);
      })
      .then(() => assignBattleMaxRounds(db, battleId))
      .then(() => Promise.all([
        // NOTE(cdata): This will cause the battle to be considered started.
        db.ref(`/battles/${battleId}/startedAt`).set(Date.now()),
        db.ref(`/battles/${battleId}/status/engaged`).set(true)
      ]));
}


/**
 * Registers a move by the provided user, for a specified battle. If a
 * corresponding move is available for the opposing user of the same battle,
 * computes the outcome of a round and updates the battle with the new round
 * information.
 */
function performMove(db, userId, battleId, polydexId, attributeName) {

  // TODO(cdata): assert shape of the move here? Maybe not necessary because
  // the database rules will validate it when we try to set it.

  // TODO(cdata): assert that the chosen Polymon hasn't already been chosen
  // in a previous round of battle.

  return ensureHasActiveBattle(db, userId, battleId)
      .then(() => ensureBattleNotFinished(db, battleId))
      .then(() => db.ref(`/battles/${battleId}`))
      .then(battleRef => battleRef.once('value')
          .then(snapshot => snapshot.val())
          .then(battle => battleRef.child(`state/${userId}/moves`).push({
            index: battle.currentRound,
            polydexId: polydexId,
            attributeName: attributeName
          })))
      .then(resolveCurrentRound(db, battleId));
}


function resolveCurrentRound(db, battleId) {
  return db.ref(`/battles/${battleId}`).once('value')
      .then(snapshot => snapshot.val())
      .then(battle => Promise.all([
        battle,
        // Step 1: Look up the moves each user chose for the current round.
        userMoveForBattleRound(
            db, battle.initiatingUserId, battleId, battle.currentRound),
        userMoveForBattleRound(
            db, battle.defendingUserId, battleId, battle.currentRound)
      ]))
      .then(results => {
        let [battle, initiatingUserMove, defendingUserMove] = results;

        if (initiatingUserMove == null || defendingUserMove == null) {
          // NOTE(cdata): This implies that we do not yet have moves for the
          // current round from both users.
          return null;
        }

        const currentRound = battle.currentRound;
        const lastRound = battle.maxRounds;

        // Step 2: Calculate a random modifier for each user.
        initiatingUserMove.randomModifier = randomModifier();
        defendingUserMove.randomModifier = randomModifier();

        return Promise.all([
          // Step 3: Look up the chosen Polymon for each user.
          getUserPolymon(
              db, battle.initiatingUserId, battleId, currentRound),
          getUserPolymon(
              db, battle.defendingUserId, battleId, currentRound)
        ]).then((initiatingUserPolymon, defendingUserPolymon) => {

          // Step 4: Compute the damage for each user based on the chosen move.
          initiatingUserMove.damageDelta =
              compareMoves(
                  initiatingUserMove, initiatingUserPolymon,
                  defendingUserMove,  defendingUserPolymon);
          defendingUserMove.damageDelta =
              compareMoves(
                  defendingUserMove,  defendingUserPolymon,
                  initiatingUserMove, initiatingUserPolymon);

          return db.ref(`/battle/${battleId}/status/rounds`).push({
            [battle.initiatingUserId]: initiatingUserMove,
            [battle.defendingUserId]: defendingUserMove
          });
        })
        // Step 5: Check if we just completed the last round.
        .then(() => currentRound < lastRound
            ? db.ref(`/battle/${battleId}/currentRound`).set(currentRound + 1)
            : finishBattle(db, battleId));
      });
}


/**
 * Aggregates damage recorded for both players to decide who won.
 */
function finishBattle(db, battleId) {
  return db.ref(`/battles/${battleId}`).once('value')
      .then(snapshot => snapshot.val())
      .then(battle => {
        const { initiatingUserId, defendingUserId } = battle;

        console.log(`Finishing Battle ${battleId}`);

        const [ initiatingUserDamage, defendingUserDamage ] =
            Object.keys(battle.status.rounds)
            .map(roundId => battle.status.rounds[roundId])
            .reduce((damages, round) => {
              damages[0] += round[initiatingUserId].damageDelta;
              damages[1] += round[defendingUserId].damageDelta;
              return damages;
            }, [0, 0]);

        let winningId;

        console.log(`Initiating User Damage: ${initiatingUserDamage}`);
        console.log(`Defending User Damage: ${defendingUserDamage}`);

        if (initiatingUserDamage > defendingUserDamage) {
          console.log(`Defending User ${defendingUserId} wins!`);
          winningId = defendingUserId;
        } else if (defendingUserDamage > initiatingUserDamage) {
          console.log(`Initiating User ${initiatingUserId} wins!`);
          winningId = initiatingUserId;
        } else {
          // NOTE(cdata): This is the draw condition.
          console.log('The battle ends in a draw!');
          winningId = 0;
        }

        return Promise.all([
          db.ref(`/battles/${battleId}/finishedAt`).set(Date.now()),
          db.ref(`/battles/${battleId}/status/winningUserId`).set(winningId)
        ]);
      });
}


/**
 * Updates the heartbeat for a specified user in a specified battle.
 */
function recordHeartbeat(db, userId, battleId) {

  console.log('Recording heartbeat for User ${userId} in Battle ${battleId}..');

  return ensureHasActiveBattle(db, userId, battleId)
      .then(() => ensureBattleNotFinished(db, battleId))
      .then(() => db.ref(`/battles/${battleId}/state/${userId}/heartbeat`))
      .then(ref => ref.set(Date.now()));
}


exports.processBattleQueue = functions => functions
    .database()
    .path('/users/{userId}/battleQueue/{messageId}')
    .on('write', event => {
      const message = event.data.val();
      const userId = event.params.userId;
      const db = functions.app.database();

      if (message == null) {
        console.log('No Battle Request, ignoring..');
        return null;
      }

      console.log(`Battle Request Created At: ${message.createdAt}`);
      console.log(`Battle Request Action: ${message.action}`);

      let action;

      switch (message.action) {
        case 'initiate':
          action = initiateBattle(db, userId);
          break;
        case 'join':
          action = joinBattle(db, userId, message.battleId);
          break;
        case 'move':
          action = performMove(
              db,
              userId,
              message.battleId,
              message.polydexId,
              message.attributeName);
          break;
        case 'ping':
          action = recordHeartbeat(db, userId, message.battleId);
          break;
        default:
          action = Promise.resolve();
          break;
      }

      return action
          .catch(error => console.error(error))
          .then(() => event.data.ref.remove());
    });