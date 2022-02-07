#!/usr/bin/env bash
set -e

[ -z "$SPEAKER" ] && echo "Missing \$SPEAKER environment variable" && exit 1

export NEAR_ENV=testnet
export CONTRACT=inbox.$OWNER

echo
echo 'About to call sendMessage() on the contract'
echo near call \$CONTRACT sendMessage '{"message":"$1"}' --account_id \$SPEAKER --amount \$1
echo
echo \$CONTRACT is $CONTRACT
echo \$SPEAKER is $SPEAKER
echo \$1 is [ $1 ] '(the message)'
echo \$2 is [ $2 NEAR ] '(optionally attached amount)'
echo
near call $CONTRACT sendMessage '{"message":"'"$1"'"}' --account_id $SPEAKER --amount $2
