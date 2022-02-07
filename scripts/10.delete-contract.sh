#!/usr/bin/env bash

[ -z "$OWNER" ] && echo "Missing \$OWNER environment variable" && exit 1

# exit on first error after this point
set -e

export NEAR_ENV=testnet

echo "deleting thanks.$OWNER and setting $OWNER as beneficiary"
echo
near delete inbox.$OWNER $OWNER
