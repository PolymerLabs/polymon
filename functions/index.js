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
