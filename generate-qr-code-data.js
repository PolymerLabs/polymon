const readJson = require('then-read-json');
const writeJson = require('then-write-json');
const SHA256 = require('crypto-js/sha256');
const secret = process.env.POLYMON_SECRET || 'NO_SECRET_SPECIFIED';

readJson('./src/polymon-app/polymon.json').then(function(polymons) {
  return writeJson('./polymon-qr-code-data.json', polymons.map(polymon => {
    return Object.assign({}, polymon, {
      sha: SHA256(`${polymon.shortName}${secret}`).toString()
    });
  }));
});
