const readJson = require('then-read-json');
const writeJson = require('then-write-json');
const del = require('del');
const SHA256 = require('crypto-js/sha256');
const secret = process.env.POLYMON_SECRET || 'NO_SECRET_SPECIFIED';
const polymonQrCodeData = './polymon-qr-code-data.json';
const polymonFirebaseData = './polymon-firebase-data.json';


del([polymonQrCodeData, polymonFirebaseData]).then(() => {
  return readJson('./src/polymon-app/polymon.json').then(polymons => {
    const polymonsWithShas = polymons.map(polymon => {
      return Object.assign({}, polymon, {
        sha: SHA256(`${polymon.shortName}${secret}`).toString()
      });
    });

    const shaToPolymon = polymonsWithShas.reduce((shas, polymon, index) => {;
      shas[polymon.sha] = polymons[index];
      return shas;
    }, {});

    return Promise.all([
      writeJson(polymonQrCodeData, polymonsWithShas),
      writeJson(polymonFirebaseData, shaToPolymon)
    ]);
  });
}).catch(error => {
  console.error(error);
});
