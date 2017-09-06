/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

const { wait } = require('./common');

exports.popNotifications = functions => functions.database
    .ref('/users/{userId}/notifications/{notificationId}/acknowledged')
    .onWrite(event => {
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
