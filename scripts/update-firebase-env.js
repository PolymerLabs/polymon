const polymon = require('./_common');
const firebaseTools = require('firebase-tools');
const getProjectId = require('firebase-tools/lib/getProjectId');

polymon.getPolymonEnv().then(polymonEnv => {
  const firebaseConfig = polymonEnv.config.firebase;
  const projectId = firebaseConfig.projectId;
  const env = firebaseConfig.env || {};
  const args = Object.keys(env).map(key => `${key}=${env[key]}`);

  console.log(`Updating Firebase env for ${projectId}...`);

  return firebaseTools.env.set(args, { project: projectId })
      .then(() => firebaseTools.env.get([], {project: projectId }))
      .then(finalEnv => console.log('Firebase env after update:\n', finalEnv))
      .catch(e => console.error(e));
});
