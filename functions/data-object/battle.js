const DataObject = require('../data-object');
const User = require('./user');

class Battle extends DataObject {
  static get properNoun() { return 'Battle'; }

  static async create(db, tournamentId) {
    // NOTE(cdata): Firebase Functions currently execute in a Node v6
    // environment. Since we have to transpile async to generators, we also
    // cannot use super in async functions.
    return DataObject.create.call(this, db, {
      createdAt: Date.now(),
      tournamentId: tournamentId,
      status: {
        engaged: false
      }
    });
  }

  async withdrawParticipatingUser(userId) {
    const isStarted = await this.isStarted();

    if (isStarted) {
      throw new Error(
          `Cannot withdraw from ${this.formalName} because it is already started.`);
    }

    const battle = this.read();
    const user = new User(this.db, userId);

    if (battle.initiatingUserId === userId) {
      await this.ref.remove();
    } else if (battle.defendingUserId !== userId) {
      throw new Error(
          `${user.formalName} cannot leave ${battle.formalName} (not participating).`);
    }

    await user.ref.child('player/activeBattleId').remove();
  }

  async hasParticipatingUser(userId) {
    const user = new User(db, userId);
    const isInThisBattle = await user.activeBattleIs(this.id);

    return isInThisBattle;
  }

  async isPartOfATournament() {
    const battle = await this.read();

    return battle.tournamentId != null;
  }

  async isFinished() {
    const battle = await this.read();

    return battle.finishedAt != null;
  }

  async isStarted() {
    const battle = await this.read();

    return battle.startedAt != null;
  }

  async isJoinable() {
    console.log(`Checking if ${this.formalName} is joinable...`);

    const isFinished = await this.isFinished();
    if (isFinished) {
      console.log(`${this.formalName} already finished.`);
      return false;
    }
    const isStarted = await this.isStarted();
    if (isStarted) {
      console.log(`${this.formalName} already started.`);
      return false;
    }
    return true;
  }

  async isReadyToStart() {
    console.log(`Checking if ${this.formalName} is ready to start...`);

    const battle = await this.read();

    return battle.initiatingUserId != null && battle.defendingUserId != null;
  }

  async getTournamentId() {
    const battle = await this.read();

    return battle.tournamentId;
  }

  async getWinningUserId() {
    const snapshot = await this.ref.child('status/winningUserId').once('value');

    return snapshot.val();
  }

  async addParticipant(userId) {
    const battleCanBeJoined = await this.isJoinable();

    if (!battleCanBeJoined) {
      throw new Error(
          `${this.formalName} is no longer accepting participants.`);
    }

    const user = new User(this.db, userId);
    const teamSize = await user.getTeamSize();

    if (teamSize < 3) {
      throw new Error(
          `Team has ${teamSize} Polymon, but needs at least 3.`);
    }

    if (teamSize > 5) {
      throw new Error(
          `Team has ${teamSize} Polymon, but must have at most 5.`);
    }

    const battle = await this.read();
    const ref = this.ref;
    const userRole = battle.initiatingUserId == null
        ? 'initiating'
        : 'defending'

    await Promise.all([
      ref.child(`${userRole}UserId`).set(user.id),
      ref.child(`state/${user.id}`).set({
        heartbeat: Date.now()
      }),
      ref.child(`status/players/${user.id}`).set({
        ready: true,
        waiting: true,
        health: 15
      }),
      user.setActiveBattle(this.id)
    ]);

    console.log(`${user.formalName} has joined ${this.formalName}.`);

    const isReadyToStart = await this.isReadyToStart();

    if (isReadyToStart) {
      await this.start();
    }
  }

  async start() {
    const ref = this.ref;
    const battle = await this.read();

    console.log(`${this.formalName} is starting.`);

    const initiatingUser = new User(this.db, battle.initiatingUserId);
    const defendingUser = new User(this.db, battle.defendingUserId);

    const initiatingUserTeamSize = await initiatingUser.getTeamSize();
    const defendingUserTeamSize = await defendingUser.getTeamSize();

    const maxRounds = Math.min(initiatingUserTeamSize, defendingUserTeamSize) - 1;

    await Promise.all([
      ref.child('maxRounds').set(maxRounds),
      ref.child('currentRound').set(0)
    ]);

    await Promise.all([
      ref.child('startedAt').set(Date.now()),
      ref.child('status/engaged').set(true),
      ref.child(`status/players/${battle.initiatingUserId}/waiting`).set(false),
      ref.child(`status/players/${battle.defendingUserId}/waiting`).set(false)
    ]);
  }
}

module.exports = Battle;
