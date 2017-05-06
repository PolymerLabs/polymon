const polymon = require('./_common');

const unlockPolydex = async uid => {
  if (!uid) {
    throw new Error('UID not specified.\n\t\tPlease specify UID with the ' +
        '--uid flag.');
  }

  const env = await polymon.getPolymonEnv();
  const db = env.firebaseApp.database();
  let res, rej;


  const dataSnapshot = await db.ref('/references').once('value');
  const references = dataSnapshot.val();
  const polymonIds = Object.values(references);

  const dbObjects = polymonIds.map(polymonId => {
    return {
      caughtAt: Date.now(),
      catchId: 'admin',
      polymonId: polymonId
    }
  });

  await db.ref(`/users/${uid}/polydex`).set(dbObjects);
  await env.firebaseApp.delete();
}

module.exports = {
  unlockPolydex: unlockPolydex
}