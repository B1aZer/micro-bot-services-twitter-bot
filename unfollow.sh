#!/bin/bash
source ~/.nvm/nvm.sh
nvm use v16.13.1 > /dev/null
cd /home/hipi/Sites/GooDee/twitter
cp unfollow.log unfollow-prev.log 2>/dev/null
TWITTER_NAME="goodeefi" node unfollow.js | ts '[%Y-%m-%d %H:%M:%.S]' > unfollow.log
#sleep 1m
#TWITTER_NAME="GooDeeBotMint" node unfollow.js | ts '[%Y-%m-%d %H:%M:%.S]' >> unfollow.log
#sleep 1m
#TWITTER_NAME="GooDeeBotNew" node unfollow.js | ts '[%Y-%m-%d %H:%M:%.S]' >> unfollow.log
#sleep 1m
#TWITTER_NAME="GooDeeBotOS" node unfollow.js | ts '[%Y-%m-%d %H:%M:%.S]' >> unfollow.log
