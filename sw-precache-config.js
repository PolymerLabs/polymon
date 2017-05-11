module.exports = {
  staticFileGlobs: [
    '/index.html',
    '/manifest.json',
    '/bower_components/webcomponentsjs/webcomponents-lite.min.js',
    '/bower_components/webrtc-polyfill/index.js',
    '/images/polymon_sprite_sheet.svg',
    '/images/polymon_icon.png',
    '/images/space_bg@1x.jpg',
    '/images/space_bg@2x.jpg',
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
