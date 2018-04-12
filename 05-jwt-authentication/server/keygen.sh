#!/bin/bash

if [ ! -f "./privatekey.pem"  ] ||  [ ! -f "./publickey.pem" ]; then
  echo "./privatekey.pem and or ./publickey.pem were not found."
  echo "Generating them with openssl now."
  echo "These keys are generated with the pass phrase 'iloverealm'. And are NOT to be used in production"
  openssl genrsa -out privatekey.pem 2048
  openssl rsa -in privatekey.pem -outform PEM -passin pass:ilovesushi -pubout -out publickey.pem
else
  echo 'There is already a privatekey.pem and publickey.pem'
fi
