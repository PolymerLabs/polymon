const { recordPolymonSighting } = require('./common');

exports.validateCaughtPolymon = functions => functions
    .database()
    .path('/users/{userId}/catchQueue/{catchId}')
    .on('write', event => {
      const userId = event.params.userId;
      const catchValue = event.data.val();

      if (catchValue == null) {
        return null;
      }

      const referenceId = catchValue.code;

      if (referenceId == null) {
        console.log('No Reference ID, ignoring..')
        return event.data.val();
      }

      const catchId = event.data.key;
      const db = functions.app.database();
      const auth = functions.app.auth();
      const referenceRef = db.ref(`/references/${referenceId}`);

      // If we don't have a referenceId, it means this is probably the write
      // performed by the function removing the queued catch event


      console.log(`Reference ID: ${referenceId}`);
      console.log(`Catch ID: ${catchId}`);
      console.log(`User ID: ${userId}`);

      return referenceRef.once('value').then(snapshot => {
        if (snapshot.exists()) {
          let polymonId = snapshot.val();

          console.log('Polymon ID:', polymonId);

          return db.ref(`/users/${userId}/polydex`)
              .orderByChild('polymonId').once('value')
              .then(snapshot => {
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
              })
              .then(() =>
                  recordPolymonSighting(db, polymonId, catchValue.latLng));
        }
      }).catch(error => {
        console.error(`Validation: ${error}`);
      }).then(() => event.data.ref.remove());
    });
