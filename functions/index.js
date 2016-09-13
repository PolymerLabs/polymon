const functions = require('firebase-functions');
const battle = require('./battle');
const team = require('./team');
const catching = require('./catching');

exports.processBattleQueue = battle.processBattleQueue(functions);
exports.validateTeam = team.validateTeam(functions);
exports.validateCaughtPolymon = catching.validateCaughtPolymon(functions);
