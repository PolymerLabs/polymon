const common = require('./_common');
const readJson = require('then-read-json');

module.exports.updatePolymons = async () => {
  const polymon = await common.getPolymonEnv();
  const polymons = await readJson(common.polymonJsonPath);
  const formattedPolymons = polymons.map((polymon, index) => {
    return Object.assign({
      shortName: polymon.shortName || polymon.name.toLowerCase(),
      spriteIndex: index
    }, polymon);
  });

  const app = polymon.firebaseApp;
  const projectId = polymon.config.firebase.projectId;
  const secret = polymon.secret;
  const db = app.database();
  const polymonsRef = db.ref('/polymons');
  const referencesRef = db.ref('/references');
  const polymonsSnapshot = await polymonsRef.once('value');

  const operations = [];

  polymonsSnapshot.forEach(snapshot => {
    const key = snapshot.key;
    const remotePolymon = snapshot.val();
    let existingPolymon;

    for (let i = 0; i < formattedPolymons.length; ++i) {
      if (formattedPolymons[i].shortName === remotePolymon.shortName) {
        existingPolymon = formattedPolymons.splice(i, 1).pop();
        break;
      }
    }

    if (existingPolymon != null) {
      const ref = db.ref(`/polymons/${key}`);
      console.log('Updating existing Polymon:', existingPolymon.name);
      operations.push(Promise.all([
        ref.child('stats').set(existingPolymon.stats),
        ref.child('name').set(existingPolymon.name),
        ref.child('spriteIndex').set(existingPolymon.spriteIndex)
      ]));
    }
  });

  formattedPolymons.forEach(newPolymon => {
    const reference = common.makeReference(newPolymon);
    const polymonPushPromise = polymonsRef.push(newPolymon);
    const polymonKey = polymonPushPromise.key;
    const referenceUpdatePromise =
        referencesRef.child(reference).set(polymonKey);

    console.log('Creating new Polymon:', newPolymon.name);

    operations.push(polymonPushPromise);
    operations.push(referenceUpdatePromise);
  });

  await Promise.all(operations);

  console.log('Done updating Polymons!');
};
