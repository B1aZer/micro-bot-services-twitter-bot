#!/bin/bash
source ~/.nvm/nvm.sh
nvm use v16.13.1 > /dev/null
cd /home/hipi/Sites/GooDee/twitter
cp featured.log featured-prev.log
sleep $[ ( $RANDOM % 10 )  + 1 ]m
node featured.js | ts '[%Y-%m-%d %H:%M:%.S]' > featured.log
