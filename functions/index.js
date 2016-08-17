const functions = require('firebase-functions');

function value(ref) {
  return new Promise((resolve, reject) => {
    ref.once('value', resolve);
  });
}

exports.validateCaughtPolymon = functions
    .database()
    .path('/users/{userId}/polydex/{polydexId}')
    .on('write', function(event) {
      const data = event.data;
      const key = data.key;
      const polymon = data.val();
      const db = functions.app.database();
      const ref = db.ref(`polymon/${polymon.id}`);

      return value(ref).then(snapshot => {
        if (!snapshot.exists()) {
          return data.ref.remove();
        }
      });
    });
