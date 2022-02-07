#!/usr/bin/env bash
set -e

export NEAR_ENV=testnet
export CONTRACT=inbox.$OWNER

echo
echo 'About to call getOwnerPublicKey() on the contract'
echo near call \$CONTRACT getOwnerPublicKey --accountId $OWNER
echo
echo \$CONTRACT is $CONTRACT
echo
near call $CONTRACT getOwnerPublicKey --accountId $OWNER
