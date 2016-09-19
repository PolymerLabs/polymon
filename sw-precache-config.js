module.exports = {
  staticFileGlobs: [
    '/index.html',
    '/manifest.json',
    '/bower_components/webcomponentsjs/webcomponents-lite.min.js',
    '/bower_components/webrtc-polyfill/index.js',
    '/images/polymon_sprite_sheet.svg',
    '/images/polymon_icon.png',
    '/fonts/**/*'
  ],
  navigateFallback: '/index.html',
  navigateFallbackWhitelist: [/^(?!\/__)/]
};
