const promisify = require('promisify-node');
const handlebars = require('handlebars');
const fs = promisify('fs');
const del = require('del');
const path = require('path');
const envJsonPath = path.resolve(__dirname, '../.active.env.json');
const indexTemplatePath = path.resolve(__dirname, '../templates/index.handlebars.html');
const indexHtmlPath = path.resolve(__dirname, '../client/index.html');
const readJson = require('then-read-json');

Promise.all([
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
