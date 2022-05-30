#!/bin/bash
source ~/.nvm/nvm.sh
nvm use v16.13.1 > /dev/null
cd /home/hipi/Sites/GooDee/twitter
node tomorrow.js | ts '[%Y-%m-%d %H:%M:%.S]' > tomorrow.log
