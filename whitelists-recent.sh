#!/bin/bash
source ~/.nvm/nvm.sh
nvm use v16.13.1 > /dev/null
cd /home/hipi/Sites/GooDee/twitter
cp whitelists-recent.log whitelists-recent-prev.log
node whitelists-recent.js | ts '[%Y-%m-%d %H:%M:%.S]' > whitelists-recent.log
