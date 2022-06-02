const dotenv = require('dotenv');
dotenv.config();
const axios = require('axios');
const { randomIntFromInterval } = require('../_utils/index.js');

init();

// 15 requests per 15 minutes per endpoint. 
// remove from followers if not followed back for 5 days

async function init() {
    const { data: users } = await axios.get(`${process.env.LOGGER_URL}/get`, {
        params: {
            name: 'twitter-mentions',
            id: 5, //5 days ago
            groupBy: 10
        }
    });
    if (!users.length) {
        // no users to unfollow
        // silently exit
        return;
    }
    const { data: {id} } = await axios.get(`${process.env.TWITTER_URL}/id`, {
        params: {
            username: process.env.TWITTER_NAME,
            twitterHandle: process.env.TWITTER_NAME,
        }
    });
    const { data: followers } = await axios.get(`${process.env.TWITTER_URL}/followers`, {
        params: {
            username: process.env.TWITTER_NAME,
            userId: id,
        }
    });
    const myFollowersIds = followers.map(el => el.id);
    for (const usersBy10 of users) {
        for (const user of usersBy10) {
            try {
                const twitterHandle = user.handle.replace('@', '');
                const { data: {id} } = await axios.get(`${process.env.TWITTER_URL}/id`, {
                    params: {
                        username: process.env.TWITTER_NAME,
                        twitterHandle: `${twitterHandle}`,
                    }
                });
                if (myFollowersIds.indexOf(id) === -1) {
                    await axios.post(`${process.env.TWITTER_URL}/unfollow`, {
                        username: process.env.TWITTER_NAME,
                        userId: `${id}`,
                    });
                    console.log(`user ${process.env.TWITTER_NAME} unfollowed ${user.handle}`);
                    // wait 1-5s
                    await new Promise(r => setTimeout(r, randomIntFromInterval(1, 5, Math.random()) * 1000));
                }       
            } catch (err) {
                console.log(`[ERROR]: user ${user} not followed by ${process.env.TWITTER_NAME} ${JSON.stringify(err)}`);
                continue;
            }
        }
        // wait 10-20m
        await new Promise(r => setTimeout(r, randomIntFromInterval(10, 20, Math.random()) * 60 * 1000));
    }
}