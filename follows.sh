#!/bin/bash
source ~/.nvm/nvm.sh
nvm use v16.13.1 > /dev/null
cd /home/hipi/Sites/GooDee/twitter
cp follows.log follows-prev.log 2>/dev/null
TWITTER_NAME="goodeefi" node follows.js | ts '[%Y-%m-%d %H:%M:%.S]' > follows.log
sleep 1m
#TWITTER_NAME="GooDeeBotMint" node follows.js | ts '[%Y-%m-%d %H:%M:%.S]' >> follows.log
#sleep 1m
#TWITTER_NAME="GooDeeBotNew" node follows.js | ts '[%Y-%m-%d %H:%M:%.S]' >> follows.log
#sleep 1m
#TWITTER_NAME="GooDeeBotOS" node follows.js | ts '[%Y-%m-%d %H:%M:%.S]' >> follows.log
