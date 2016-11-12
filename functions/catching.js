const {
  recordPolymonSighting,
  userErrorNotifier
} = require('./common');

exports.validateCaughtPolymon = functions => functions
    .database()
    .path('/users/{userId}/catchQueue/{catchId}')
    .onWrite(event => {
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

      const catchId = event.params.catchId;
      const db = functions.app.database();
      const auth = functions.app.auth();

      // If we don't have a referenceId, it means this is probably the write
      // performed by the function removing the queued catch event

      console.log(`Reference ID: ${referenceId}`);
      console.log(`Catch ID: ${catchId}`);
      console.log(`User ID: ${userId}`);

      return db.ref(`/references/${referenceId}`).once('value')
        .then(snapshot => {
          if (!snapshot.exists()) {
            throw new Error('Reference not found.');
          }
          const polymonId = snapshot.val();
          // Get polydex.
          return db.ref(`/users/${userId}/polydex`).once('value')
            .then(snapshot => {
              // Search entry with matching polymonId.
              const polydexEntries = snapshot.val();
              for (let id in polydexEntries) {
                // Found matching polymon! Search for its name for nicer error msg.
                if (polydexEntries[id].polymonId === polymonId) {
                  return db.ref(`/polymons/${polymonId}`).once('value')
                      .then(snapshot => snapshot.val().name)
                      .then(polymonName => {
                        throw new Error(`You already caught ${polymonName}.`);
                      });
                }
              }
              console.log('Recording catch in Polydex.');
              return db.ref(`/users/${userId}/polydex`).push({
                caughtAt: Date.now(),
                catchId,
                polymonId
              }).then(() => recordPolymonSighting(db, polymonId, catchValue.latLng));
            });
        })
        .catch(userErrorNotifier(db, userId))
        .then(() => event.data.ref.remove());
    });


exports.beaconCapture = functions => functions
    .cloud
    .https()
    .onRequest((req, res) => {
      const db = functions.app.database();
      const reference = req.query.reference;
      const target = req.query.target;
      const redirect = functions.env.beaconRedirect;

      return db.ref(`/references/${reference}`).once('value')
          .then(snapshot => snapshot.val())
          .then(polymonId => db.ref(`/polymons/${polymonId}`).once('value'))
          .then(snapshot => snapshot.val())
          .then(polymon => {
            let polymonRedirect = redirect;

            if (polymon != null) {
              polymonRedirect += `/code/reference.${reference}`;
            }

            return res.send(
`
<!doctype html>
<html>
  <head>
    <title>A ${polymon.name} Polymon is nearby</title>
    <meta charset="utf-8">
    <meta name="description" content="Tap here to catch the ${polymon.name}!">
    <link rel="icon" sizes="356x356" href="${redirect}/images/polymon_monster_${polymon.spriteIndex}.png">
  </head>
  <body>
    <script>
      // Redirect...
      console.log('Redirecting to ${polymonRedirect}...');
      window.location = '${polymonRedirect}';
    </script>
    <p>Follow <a href="${polymonRedirect}">this link</a> to catch the ${polymon.name} Polymon!</p>
  </body>
</html>
`);
          }).catch(error => {
            console.error(error);
            return res.send(`<script>window.location='${redirect}';`);
          });
    });
