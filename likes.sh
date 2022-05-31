#!/bin/bash
source ~/.nvm/nvm.sh
nvm use v16.13.1 > /dev/null
cd /home/hipi/Sites/GooDee/twitter
TWITTER_NAME="goodeefi" node likes.js | ts '[%Y-%m-%d %H:%M:%.S]' >> likes.log
sleep 1m
TWITTER_NAME="GooDeeBotMint" node likes.js | ts '[%Y-%m-%d %H:%M:%.S]' >> likes.log
sleep 1m
TWITTER_NAME="GooDeeBotNew" node likes.js | ts '[%Y-%m-%d %H:%M:%.S]' >> likes.log
sleep 1m
TWITTER_NAME="GooDeeBotOS" node likes.js | ts '[%Y-%m-%d %H:%M:%.S]' >> likes.log
