/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

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
