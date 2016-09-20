const promisify = require('promisify-node');
const handlebars = require('handlebars');
const fs = promisify('fs');
const del = require('del');
const path = require('path');
const indexTemplatePath = path.resolve(__dirname, '../templates/index.handlebars.html');
const indexHtmlPath = path.resolve(__dirname, '../client/index.html');

const firebase = {
  appName: process.env.FIREBASE_APP_NAME,
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseUrl: process.env.FIREBASE_DATABASE_URL,
  serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
};

fs.readFile(indexTemplatePath)
    .then(buffer => buffer.toString())
    .then(templateSource => {
      let template = handlebars.compile(templateSource);
      let html = template({ firebase });
      return del([indexHtmlPath]).then(() => fs.writeFile(indexHtmlPath, html));
    })
    .then(() => console.log(`Generated\n> ${indexHtmlPath}\nfrom\n> ${indexTemplatePath}`))
    .catch(e => console.error(e));
