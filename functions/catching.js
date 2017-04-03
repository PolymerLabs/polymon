const { recordPolymonSighting } = require('./common');

exports.validateCaughtPolymon = (functions, admin) => functions.database
    .ref('/users/{userId}/catchQueue/{catchId}')
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
      const db = admin.database();
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


exports.beaconCapture = (functions, admin) => functions.https
    .onRequest((req, res) => {
      const db = admin.database();
      const reference = req.query.reference;
      const target = req.query.target;
      const redirect = functions.config().beacon.redirect;

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
