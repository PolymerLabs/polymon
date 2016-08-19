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
      const referenceId = event.data.val();
      const catchId = event.data.key;
      const db = functions.app.database();
      const auth = functions.app.auth();
      const referenceRef = db.ref(`/references/${referenceId}`);

      if (referenceId == null) {
        console.log('No Reference ID, ignoring..')
        return;
      }

      console.log(`Reference ID: ${referenceId}`);
      console.log(`Catch ID: ${catchId}`);
      console.log(`User ID: ${userId}`);

      return value(referenceRef).then(snapshot => {
        let polymonId = snapshot.val();

        console.log('Polymon ID:', polymonId);

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
