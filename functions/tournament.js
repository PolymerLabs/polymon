const Tournament = require('./data-object/tournament');
const Battle = require('./data-object/battle');
const { userErrorNotifier } = require('./common');

async function findTournamentBattle(db, battleId) {
  const battle = new Battle(db, battleId);
  const isPartOfATournament = await battle.isPartOfATournament();

  return isPartOfATournament
      ? battle
      : null;
}

exports.observeBattleFinished = (functions, admin) => functions.database
    .ref('/battles/{battleId}/finishedAt')
    .onWrite(async function(event) {
      const db = admin.database();
      const tournamentBattle = await findTournamentBattle(db, event.params.battleId);

      if (tournamentBattle == null) {
        console.log(`Battle ${battleId} is not a part of a tournament.`);
        return;
      }

      const isFinished = await tournamentBattle.isFinished();

      if (!isFinished) {
        return;
      }

      const tournamentId = await tournamentBattle.getTournamentId();
      const tournament = new Tournament(db, tournamentId);

      await tournament.resolveCurrentBattle();
    });

exports.observeBattleStarted = (functions, admin) => functions.database
    .ref('/battles/{battleId}/startedAt')
    .onWrite(async function(event) {
      const db = admin.database();
      const tournamentBattle = await findTournamentBattle(db, event.params.battleId);

      if (tournamentBattle == null) {
        console.log(`Battle ${battleId} is not a part of a tournament.`);
        return;
      }

      const isStarted = await tournamentBattle.isStarted();

      if (!isStarted) {
        return;
      }

      const tournamentId = await tournamentBattle.getTournamentId();
      const tournament = new Tournament(db, tournamentId);

      await tournament.ref.child('state').set(Tournament.state.ACTIVE);
    });


exports.processTournamentQueue = (functions, admin) => functions.database
    .ref('/users/{userId}/tournamentQueue/{messageId}')
    .onWrite(async function(event) {
      const message = event.data.val();
      const { userId } = event.params;

      if (message != null) {
        const { action } = message;
        const db = admin.database();
        const errorNotifier = userErrorNotifier(db, userId);

        console.log(`Tournament action for User ${userId}: ${action}`);

        try {
          switch (action) {
            case 'create': {
              const { secret } = message;

              await Tournament.create(admin.database(), secret);
              break;
            }

            case 'join': {
              const { token } = message;
              const [ tournamentId, secret ] = token.split('|');
              const tournament = new Tournament(admin.database(), tournamentId);

              await tournament.addPlayerWithSecret(userId, secret);
              break;
            }

            default:
              console.error(`Unrecognized action type: ${action}`);
              break;
          }
        } catch (error) {
          errorNotifier(error);
        }
      }

      await event.data.ref.remove();
    });

