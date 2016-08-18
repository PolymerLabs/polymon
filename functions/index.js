const functions = require('firebase-functions');

function value(ref) {
  return new Promise((resolve, reject) => {
    ref.once('value', resolve);
  });
}

exports.validateCaughtPolymon = functions
    .database()
    .path('/users/{userId}/catchQueue/{catchId}')
    .on('write', function(event) {
      const userId = event.params.userId;
      const polymonId = event.data.val();
      const catchId = event.data.key;
      const db = functions.app.database();
      const auth = functions.app.auth();
      const polymonRef = db.ref(`/polymons/${polymonId}`);

      if (polymonId == null) {
        console.log('No Polymon ID, ignoring..')
        return;
      }

      console.log(`Polymon ID: ${polymonId}`);
      console.log(`Catch ID: ${catchId}`);
      console.log(`User ID: ${userId}`);

      return value(polymonRef).then(snapshot => {

        console.log('Polymon:', snapshot.val());

        const processQueue = snapshot.exists() ?
            db.ref(`/users/${userId}/polydex`).push({
              caughtAt: Date.now(),
              catchId,
              polymonId
            }) :
            Promise.resolve();

        return processQueue.then(() => event.data.ref.remove());
      });
    });
