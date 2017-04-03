const functions = require('firebase-functions');
const admin = require('firebase-admin');
const battle = require('./battle');
const team = require('./team');
const notifications = require('./notifications');
const catching = require('./catching');

admin.initializeApp(functions.config().firebase);

exports.processBattleQueue = battle.processBattleQueue(functions, admin);
exports.modifyTeam = team.modifyTeam(functions, admin);
exports.validateCaughtPolymon = catching.validateCaughtPolymon(functions, admin);
exports.popNotifications = notifications.popNotifications(functions, admin);
exports.beaconCapture = catching.beaconCapture(functions, admin);
