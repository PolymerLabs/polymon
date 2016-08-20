const path = require('path');
const xmldom = require('xmldom');
const readJson = require('then-read-json');
const fs = require('fs-promise');
const del = require('del');
const polymonJsonPath = path.resolve(__dirname, '../polymon.json');
const polymonIconsetPath =
    path.resolve(__dirname, '../client/src/polymon-app/polymon-imageset.html');
const notoSvgPath =
    path.resolve(__dirname, '../bower_components/noto-emoji/svg');

function clean() {
  return del([polymonIconsetPath]);
}

function svgString(polymon) {
  const svgPath =
      path.resolve(notoSvgPath, `./emoji_u${polymon.codePoint}.svg`);

  return fs.readFile(svgPath)
      .then(buffer => buffer.toString())
      .then(svgString => new xmldom.DOMParser().parseFromString(svgString))
      .then(document => {
        for (let i = 0; i < document.childNodes.length; ++i) {
          if (document.childNodes[i].tagName === 'svg') {
            return document.childNodes[i];
          }
        }
      })
      .then(svg => {
        let shortName = polymon.shortName;
        let paths = Array.from(svg.getElementsByTagName('path'));
        let uses = Array.from(svg.getElementsByTagName('use'));
        let groups = Array.from(svg.getElementsByTagName('g'));
        let clipPaths = Array.from(svg.getElementsByTagName('clipPath'));

        svg.setAttribute('id', shortName);

        paths.concat(groups).forEach(pathOrGroup => {
          let clipPath = pathOrGroup.getAttribute('clip-path');

          if (clipPath) {
            clipPath = clipPath.replace('url(#', `url(#${shortName}`);
            pathOrGroup.setAttribute('clip-path', clipPath);
          }
        })

        paths.forEach(path => {
          let id = path.getAttribute('id');

          if (id) {
            path.setAttribute('id', `${shortName}${id}`);
          }
        });

        uses.forEach(use => {
          let href = use.getAttribute('xlink:href');
          if (href) {
            href = href.replace('#', `#${shortName}`);
            use.setAttribute('xlink:href', href);
          }
        });

        clipPaths.forEach(clipPath => {
          let id = clipPath.getAttribute('id');

          if (id) {
            clipPath.setAttribute('id', `${shortName}${id}`);
          }
        });

        return new xmldom.XMLSerializer().serializeToString(svg);
      });
}

clean().then(() => {
  return readJson(polymonJsonPath)
      .then(polymons => Promise.all(polymons.map(polymon => svgString(polymon))))
      .then(svgStrings => `<!-- WARNING: GENERATED FILE. DO NOT EDIT! -->
<dom-module id="polymon-iconset">
${svgStrings.join('\n')}
</dom-module>`)
      .then(htmlString => fs.writeFile(polymonIconsetPath, htmlString));
}).catch(error => console.error(error));
