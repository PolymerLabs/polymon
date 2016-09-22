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

ENV_FILE=.$ENV_NAME.env.json
SERVICE_ACCOUNT_FILE=.$ENV_NAME.service-account.json

if [ ! -f $ENV_FILE ]; then
  echo "Please define an environment config in $ENV_FILE to use env $ENV_NAME!"
  exit 1
fi

if [ ! -f $SERVICE_ACCOUNT_FILE ]; then
  echo "Please place your Service Account credentials in $SERVICE_ACCOUNT_FILE to use env $ENV_NAME!"
  exit 1
fi

set -x

ln -fs $ENV_FILE ./.active.env.json
ln -fs $SERVICE_ACCOUNT_FILE ./.active.service-account.json

node ./scripts/generate-index.js
firebase use $ENV_NAME

set +x
set +e
