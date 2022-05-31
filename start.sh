#!/bin/bash
source ~/.nvm/nvm.sh
nvm use v16.13.1
node server.js | ts '[%Y-%m-%d %H:%M:%.S]' > server-twitter.log
