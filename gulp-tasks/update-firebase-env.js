/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

const polymon = require('./_common');
const firebaseTools = require('firebase-tools');
const getProjectId = require('firebase-tools/lib/getProjectId');

polymon.getPolymonEnv().then(polymonEnv => {
  const firebaseConfig = polymonEnv.config.firebase;
  const projectId = firebaseConfig.projectId;
  const env = firebaseConfig.env || {};
  const args = Object.keys(env).map(key => `${key}=${env[key]}`);

  if (!firebaseTools.env) {
    return;
  }

  console.log(`Updating Firebase env for ${projectId}...`);

  return firebaseTools.env.set(args, { project: projectId })
      .then(() => firebaseTools.env.get([], {project: projectId }))
      .then(finalEnv => console.log('Firebase env after update:\n', finalEnv))
      .catch(e => console.error(e));
});
