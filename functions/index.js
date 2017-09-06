/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

const babelRegister = require('babel-register');

babelRegister({
  presets: ["es2017"]
});

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const battle = require('./battle');
const team = require('./team');
const notifications = require('./notifications');
const catching = require('./catching');
const tournament = require('./tournament');

admin.initializeApp(functions.config().firebase);

exports.processBattleQueue = battle.processBattleQueue(functions, admin);
exports.modifyTeam = team.modifyTeam(functions, admin);
exports.validateCaughtPolymon = catching.validateCaughtPolymon(functions, admin);
exports.popNotifications = notifications.popNotifications(functions, admin);
exports.beaconCapture = catching.beaconCapture(functions, admin);
exports.observeBattleStarted = tournament.observeBattleStarted(functions, admin);
exports.observeBattleFinished = tournament.observeBattleFinished(functions, admin);
exports.processTournamentQueue = tournament.processTournamentQueue(functions, admin);
