#!/bin/bash
export PATH="/home/somto/solana-install/solana-release/bin:$HOME/.avm/bin:$HOME/.cargo/bin:$PATH"
rm -rf test-ledger
solana-test-validator --reset --quiet &
VALIDATOR_PID=$!
echo "Validator PID: $VALIDATOR_PID"
sleep 10
if ps -p $VALIDATOR_PID > /dev/null; then
   echo "Validator started successfully"
   kill $VALIDATOR_PID
else
   echo "Validator failed to start"
   ls -R test-ledger
   cat test-ledger/validator.log
fi