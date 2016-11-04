const functions = require('firebase-functions');
const battle = require('./battle');
const team = require('./team');
const notifications = require('./notifications');
const catching = require('./catching');

exports.processBattleQueue = battle.processBattleQueue(functions);
exports.modifyTeam = team.modifyTeam(functions);
exports.validateCaughtPolymon = catching.validateCaughtPolymon(functions);
exports.popNotifications = notifications.popNotifications(functions);
exports.beaconCapture = catching.beaconCapture(functions);
