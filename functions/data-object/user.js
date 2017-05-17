const DataObject = require('../data-object');

class User extends DataObject {
  static get properNoun() { return 'User'; }

  async isAdmin() {
    const user = await this.read();

    return !!user.admin;
  }

  async getActiveBattle() {
    const user = await this.read();

    return user.player && user.player.activeBattleId;
  }

  async hasActiveBattle() {
    const activeBattleId = await this.getActiveBattle();

    return activeBattleId != null;
  }

  async activeBattleIs(battleId) {
    const activeBattleId = await this.getActiveBattle();

    return activeBattleId != null && activeBattleId === battleId;
  }

  async setActiveBattle(battleId) {
    const hasActiveBattle = await this.hasActiveBattle();

    if (hasActiveBattle) {
      throw new Error(`${this.formalName} is already in a battle!`);
    }

    return await this.ref.child('player/activeBattleId').set(battleId);
  }

  async getTeamSize() {
    const user = await this.read();
    const team = user.team;

    return team
        ? Object.keys(team).length
        : 0;
  }
}

module.exports = User;
