const dotenv = require('dotenv');
dotenv.config();
const axios = require('axios');
const { randomIntFromInterval } = require('../_utils/index.js');

init();

// 50 requests per 15 minutes per endpoint. 

async function init() {
    const osHashes = ['#Ethereum', '#NFTs', '#NFT', '#ETH', '#opensea', '#NFTProject', '#NFTCommunity'];
    // throw is ok
    let res;

    const { data: users } = await axios.get(`${process.env.LOGGER_URL}/get`, {
        params: {
            name: 'twitter-mentions',
            id: 1, //yesterday
            groupBy: 10
        }
    });
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
                await axios.post(`${process.env.TWITTER_URL}/follow`, {
                    username: process.env.TWITTER_NAME,
                    userId: `${id}`,
                });
                console.log(`user ${process.env.TWITTER_NAME} followed ${user.handle}`);
                // wait 1-5s
                await new Promise(r => setTimeout(r, randomIntFromInterval(1, 5, Math.random()) * 1000));
            } catch (err) {
                console.log(`[ERROR]: user ${user} not followed by ${process.env.TWITTER_NAME} ${JSON.stringify(err)}`);
                continue;
            }

        }
        // wait 10-20m
        await new Promise(r => setTimeout(r, randomIntFromInterval(10, 20, Math.random()) * 60 * 1000));
    }
}