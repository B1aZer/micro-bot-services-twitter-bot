#!/bin/bash
source ~/.nvm/nvm.sh
nvm use v16.13.1 > /dev/null
cd /home/hipi/Sites/GooDee/twitter
cp memes.log memes-prev.log 2>/dev/null
node memes.js | ts '[%Y-%m-%d %H:%M:%.S]' > memes.log
