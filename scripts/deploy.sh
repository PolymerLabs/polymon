#!/usr/bin/env bash

node ./scripts/update-firebase-env.js
firebase deploy --only hosting -p client/build/bundled
