const { wait } = require('./common');

exports.popNotifications = functions => functions
    .database()
    .path('/users/{userId}/notifications/{notificationId}/acknowledged')
    .on('write', event => {
      const acknowledged = event.data.val();

      if (!acknowledged) {
        console.log('No notification acknowledged, skipping..');
        return event.data.val();
      }

      // NOTE(cdata): The 500ms wait is a grace period to allow for nice
      // out-going transitions. This is kinda lame to do on the server, but I'm too lazy
      // to implement it any differently.
      return wait(500)
          .then(() => event.data.adminRef.parent.remove())
          .catch(error => console.error(error));
    });
