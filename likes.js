const dotenv = require('dotenv');
dotenv.config();
const axios = require('axios');
const { pickRandom, randomIntFromInterval } = require('../_utils/index.js');

init();

// 50 requests per 15 minutes per endpoint. 

async function init() {
    const osHashes = ['#Ethereum', '#NFTs', '#NFT', '#ETH', '#opensea', '#NFTProject', '#NFTCommunity'];
    // throw is ok
    const res = await axios.get(`${process.env.TWITTER_URL}/search`, {
        params: {
            username: process.env.TWITTER_NAME,
            q: `${pickRandom(osHashes, Math.random())} lang:en -is:retweet -has:links`,
            limit: 50,
        }
    })
    const tweets = res.data;
    for (const tweet of tweets) {
        try {
            await axios.post(`${process.env.TWITTER_URL}/like`, {
                username: process.env.TWITTER_NAME,
                tweetId: `${tweet.id}`,
            });
        } catch (err) {
            console.log(`[ERROR]: ${JSON.stringify(err)}`);
        }
        // wait 10-20s
        await new Promise(r => setTimeout(r, randomIntFromInterval(10, 15, Math.random()) * 1 * 1000));
    }
}