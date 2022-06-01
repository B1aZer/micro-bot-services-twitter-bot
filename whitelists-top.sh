#!/bin/bash
source ~/.nvm/nvm.sh
nvm use v16.13.1 > /dev/null
cd /home/hipi/Sites/GooDee/twitter
cp whitelists-top.log whitelists-top-prev.log
node whitelists-top.js | ts '[%Y-%m-%d %H:%M:%.S]' > whitelists-top.log
