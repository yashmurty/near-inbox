#!/usr/bin/env bash

[ -z "$OWNER" ] && echo "Missing \$OWNER environment variable" && exit 1

# exit on first error after this point
set -e

export NEAR_ENV=testnet

echo --------------------------------------------
echo
echo "rebuilding the contract (release build)"
echo
yarn build:release

echo --------------------------------------------
echo
echo "deploying and initializing the contract in a single transaction"
echo
near deploy --accountId=inbox.$OWNER --wasmFile=./build/release/inbox.wasm --initFunction 'init' --initArgs '{"owner":"'$OWNER'"}'

exit 0
