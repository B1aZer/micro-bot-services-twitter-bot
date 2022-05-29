#!/bin/bash
source ~/.nvm/nvm.sh
nvm use v16.13.1 > /dev/null
cd /home/hipi/Sites/GooDee/twitter
node os_new.js | ts '[%Y-%m-%d %H:%M:%.S]' > os_new.log
