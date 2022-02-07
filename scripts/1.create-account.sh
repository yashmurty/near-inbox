#!/usr/bin/env bash

[ -z "$OWNER" ] && echo "Missing \$OWNER environment variable" && exit 1

# exit on first error after this point
set -e

export NEAR_ENV=testnet

echo --------------------------------------------
echo
echo "creating a subaccount under $OWNER"
echo
near create-account inbox.$OWNER --masterAccount=$OWNER --initialBalance "1"

exit 0
