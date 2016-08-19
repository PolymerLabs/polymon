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

      // If we don't have a referenceId, it means this is probably the write
      // performed by the function removing the queued catch event
      if (referenceId == null) {
        console.log('No Reference ID, ignoring..')
        return event.data.val();
      }

      console.log(`Reference ID: ${referenceId}`);
      console.log(`Catch ID: ${catchId}`);
      console.log(`User ID: ${userId}`);

      return value(referenceRef).then(snapshot => {
        if (snapshot.exists()) {
          let polymonId = snapshot.val();

          console.log('Polymon ID:', polymonId);

          return db.ref(`/users/${userId}/polydex`)
              .orderByChild('polymonId')
              .once('value').then(snapshot => {
                let polydexEntries = snapshot.val();

                for (var id in polydexEntries) {
                  if (polydexEntries[id].polymonId === polymonId) {
                    console.log(
                        `This Polymon was already caught..`);
                    return;
                  }
                }

                console.log('Recording catch in Polydex.');
                return db.ref(`/users/${userId}/polydex`).push({
                  caughtAt: Date.now(),
                  catchId,
                  polymonId
                });
              });
        }
      }).catch(error => {
        console.error(`Validation: ${error}`);
      }).then(() => event.data.ref.remove());
    });
