#!/bin/bash
source ~/.nvm/nvm.sh
nvm use v16.13.1 > /dev/null
cd /home/hipi/Sites/GooDee/twitter
cp whitelists-random.log whitelists-random-prev.log 2>/dev/null
node whitelists-random.js | ts '[%Y-%m-%d %H:%M:%.S]' > whitelists-random.log
