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
