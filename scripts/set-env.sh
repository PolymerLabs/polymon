#!/usr/bin/env bash

set -e

ENV_NAME=$1

if [ -z "$ENV_NAME" ]; then
  echo "Please specify an environment name to use!"
  echo "Example usage:"
  echo ""
  echo "./scripts/set-env.sh dev"
  exit 1
fi

FIREBASE_ENV_FILE=.firebase.$ENV_NAME.env

if [ ! -f $FIREBASE_ENV_FILE ]; then
  echo "Please export environment variables in $FIREBASE_ENV_FILE to use env $ENV_NAME!"
  exit 1
fi

set -x

source $FIREBASE_ENV_FILE
node ./scripts/generate-index.js
firebase use $ENV_NAME

set +x
set +e
