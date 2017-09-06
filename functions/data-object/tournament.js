/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http:polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http:polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http:polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http:polymer.github.io/PATENTS.txt
 */

const DataObject = require('../data-object');
const Battle = require('./battle');
const User = require('./user');

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

  async withdrawPlayer(userId) {
    const tournament = await this.read();
    const battle = new Battle(this.db, tournament.currentBattleId);
    const user = new User(this.db, userId);

    if (tournament.state === Tournament.state.ACTIVE) {
      throw new Error(
          `${this.formalName} battle is ongoing; players must complete the battle.`);
    }

    if (tournament.playerOneUserId === userId) {
      await this.ref.child('playerOneUserId').remove();
    } else if (tournament.playerTwoUserId === userId) {
      await this.ref.child('playerTwoUserId').remove();
    } else {
      throw new Error(
          `${user.formalName} is not currently in ${this.formalName} and cannot withdraw.`);
    }

    await battle.withdrawParticipatingUser(userId);
  }

  async hasUnfinishedBattle() {
    const tournament = await this.read();
    const currentBattleId = tournament.currentBattleId;

    if (currentBattleId == null) {
      return false;
    }

    const battle = new Battle(this.db, currentBattleId);
    const battleIsFinished = await battle.isFinished();

    return !battleIsFinished;
  }

  async createBattle() {
    const hasUnfinishedBattle = await this.hasUnfinishedBattle();

    if (hasUnfinishedBattle) {
      throw new Error(`${this.formalName} has an ongoing battle.`);
    }

    const battle = await Battle.create(this.db, this.id);

    await this.ref.child('currentBattleId').set(battle.id);
  }

  async resolveCurrentBattle() {
    const tournament = await this.read();
    const hasUnfinishedBattle = await this.hasUnfinishedBattle();

    if (hasUnfinishedBattle) {
      throw new Error(
          `${this.formalName} cannot resolve the current battle until it is finished.`);
    }

    const battle = new Battle(this.db, tournament.currentBattleId);
    const winningUserId = await battle.getWinningUserId();

    await Promise.all([
      this.ref.child('rounds').push({
        battleId: tournament.currentBattleId,
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
        .once('value');

    const rounds = [];
    snapshot.forEach(round => rounds.push(round));

    return (rounds && rounds.length > 0)
        ? rounds.pop().val()
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
