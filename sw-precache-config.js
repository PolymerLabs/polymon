/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

module.exports = {
  staticFileGlobs: [
    '/index.html',
    '/manifest.json',
    '/bower_components/webcomponentsjs/webcomponents-lite.min.js',
    '/bower_components/webrtc-polyfill/index.js',
    '/images/*.svg',
    '/images/*.jpg',
    '/images/polymon_monster_*.png',
    '/images/polymon_icon.png',
    '/fonts/**/*'
  ],
  navigateFallback: '/index.html',
  navigateFallbackWhitelist: [
    /^(?!\/__)/,
    /getProjectConfig/
  ],
  runtimeCaching: [{
    urlPattern: /\/music\/.*/,
    handler: 'cacheFirst',
    options: {
      cache: {
        maxEntries: 200,
        name: 'items-cache'
      }
    }
  }]
};
