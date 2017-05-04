const DataObject = require('../data-object');
const Battle = require('./battle');

class Tournament extends DataObject {
  static get state() {
    return {
      WAITING: 'waiting',
      ACTIVE: 'active'
    };
  }

  static get role() {
    return {
      PLAYER_ONE: 'playerOne',
      PLAYER_TWO: 'playerTwo'
    };
  }

  static get properNoun() { return 'Tournament'; }

  static async create(db, secret) {
    if (secret == null) {
      throw new Error(`Attempt to create a ${this.properNoun} without a secret.`);
    }

    // NOTE(cdata): Firebase Functions currently execute in a Node v6
    // environment. Since we have to transpile async to generators, we also
    // cannot use super in async functions.
    const tournament = await DataObject.create.call(this, db, {
      createdAt: Date.now(),
      state: Tournament.state.WAITING,
      secret: secret
    });

    await tournament.createBattle();

    return tournament;
  }

  async hasOngoingBattle() {
    const tournament = await this.read();
    const currentBattleId = tournament.currentBattleId;

    if (currentBattleId == null) {
      return false;
    }

    return currentBattleId != null;

    const battle = new Battle(this.db, currentBattleId);
    const battleIsFinished = await battle.isFinished();

    return !battleIsFinished;
  }

  async createBattle() {
    const hasOngoingBattle = await this.hasOngoingBattle();

    if (hasOngoingBattle) {
      throw new Error(`${this.formalName} has an ongoing battle.`);
    }

    const battle = await Battle.create(this.db, this.id);

    await this.ref.child('currentBattleId').set(battle.id);
  }

  async resolveCurrentBattle() {
    const tournament = await this.read();
    const battle = new Battle(this.db, tournament.currentBattleId);
    const battleFinished = await battle.isFinished();

    if (!battleFinished) {
      throw new Error(`${battle.formalName} is not finished yet.`);
    }

    const winningUserId = await battle.getWinningUserId();

    await Promise.all([
      this.ref.child('rounds').push({
        battleId: battle.id,
        winningUserId: winningUserId,
        playerOneUserId: tournament.playerOneUserId,
        playerTwoUserId: tournament.playerTwoUserId,
        recordedAt: Date.now()
      }),
      this.ref.child('championUserId').set(winningUserId),
      this.ref.child('playerOneUserId').remove(),
      this.ref.child('playerTwoUserId').remove(),
      this.ref.child('state').set('waiting')
    ]);

    await this.createBattle();
  }

  async addPlayerWithSecret(userId, secret) {
    const tournament = await this.read();

    if (secret !== tournament.secret) {
      throw new Error(`Wrong secret (${secret}) provided when trying to join ${this.formalName}.`);
    }

    const { currentBattleId } = tournament;
    const battle = new Battle(this.db, currentBattleId);
    const previousRound = await this.getPreviousRound();

    await battle.addParticipant(userId);

    let preferredRole = Tournament.role.PLAYER_ONE;
    let playerRole;

    if (previousRound != null && userId === previousRound.playerTwoUserId) {
      preferredRole = Tournament.role.PLAYER_TWO;
    }

    if (preferredRole === Tournament.role.PLAYER_TWO || tournament.playerOneUserId != null) {
      playerRole = Tournament.role.PLAYER_TWO;
    } else {
      playerRole = Tournament.role.PLAYER_ONE;
    }

    this.ref.child(`${playerRole}UserId`).set(userId);
  }

  async getPreviousRound() {
    const snapshot = await this.ref.child('rounds')
        .orderByChild('recordedAt')
        .once('value')

    const rounds = snapshot.val();

    if (rounds && rounds.length > 0) {
      return rounds.pop();
    }

    return (rounds && rounds.length > 0)
        ? rounds.pop()
        : null;
  }
}

/**
 * NOTE: We want to enable stick role memory so that the following
 * series of results is possible:

Bob receives phone ONE
Bob scans code

"player one joined!" appears above LEFT chair

Alice receives phone TWO
Alice scans code

"player two joined!" appears above RIGHT chair

###

Alice wins
Alice scans code

"player two joined!" appears above RIGHT chair

Fred receives phone ONE
Fred scans code

"player one joined!" appears above LEFT chair

###

Alice wins
Alice retires

Bob receives phone THREE
Bob scans code

"player one joined!" appears above LEFT chair

Jane receives phone ONE
Jane scans code

"player two joined!" appears above RIGHT chair

*/

module.exports = Tournament;
