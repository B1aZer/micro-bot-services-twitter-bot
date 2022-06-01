#!/bin/bash
source ~/.nvm/nvm.sh
nvm use v16.13.1
cp server-twitter.log server-twitter-prev.log
node server.js | ts '[%Y-%m-%d %H:%M:%.S]' > server-twitter.log
