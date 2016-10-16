#!/usr/bin/env bash

set -e
set -x

cd `pwd`/client
rm -r ./build
polymer build -v --sources "src/**/*" \
                 --sources "fonts/**/*" \
                 --sources "images/**/*" \
                 --sources "music/*.mp3" \
                 --sources "manifest.json" \
                 --sources "bower_components/webrtc-polyfill/index.js" \
                 --sources "bower_components/webcomponentsjs/webcomponents-lite.min.js" \
                 --sw-precache-config ../sw-precache-config.js

sed -i.bak s/defer=\"\"/defer/g build/bundled/index.html
sed -i.bak s/defer=\"\"/defer/g build/unbundled/index.html
rm build/bundled/index.html.bak
rm build/unbundled/index.html.bak

set +e
set +x
