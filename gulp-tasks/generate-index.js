/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

const promisify = require('promisify-node');
const handlebars = require('handlebars');
const fs = promisify('fs');
const del = require('del');
const path = require('path');
const envJsonPath = path.resolve(__dirname, '../.active.env.json');
const indexTemplatePath = path.resolve(__dirname, '../templates/index.handlebars.html');
const indexHtmlPath = path.resolve(__dirname, '../client/index.html');
const readJson = require('then-read-json');

module.exports.generate = () => {
  return Promise.all([
    readJson(envJsonPath),
    fs.readFile(indexTemplatePath).then(buffer => buffer.toString())
  ]).then(results => {
    const [config, templateSource] = results;

    const template = handlebars.compile(templateSource);
    const html = template(config);

    return del([indexHtmlPath]).then(() => fs.writeFile(indexHtmlPath, html));
  }).then(() =>
      console.log(`Generated\n> ${indexHtmlPath}\nfrom\n> ${indexTemplatePath}`))
    .catch(e => console.error(e));
}
