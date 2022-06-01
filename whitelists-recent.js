const dotenv = require('dotenv');
dotenv.config();
const axios = require('axios');
const { pickRandom, randomIntFromInterval } = require('../_utils/index.js');

init();

// 50 requests per 15 minutes per endpoint. 

async function init() {
    const { data: top10 } = await axios.get(`${process.env.LOGGER_URL}/get`, {
        params: {
            name: process.env.LOG_WHITELISTS_NAME,
            id: 'recent',
            limit: 5,
            order: 'date',
            groupBy: 5,
            notIn: 'twitter-mentions',
            notInIds: [0,1,2,3,4,5,6], // 1 week
        }
    });
    for (let i = 0; i < top10.length; i++) {
        const top5 = top10[i];
        const osHashes = ['#Ethereum', '#NFTs', '#NFT', '#ETH', '#Ethereum', '#NFTProject', '#Mint', ``];
        const header = `Most recent NFT whitelists:`;
        const body = top5.map(el => {
            return `${el.handle}
Created: ${new Date(el.date).toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
})}
Followers: ${el.followers_count}
`;
        }).join('');
        //console.log(header + `\n\n` + body + `\n` + pickRandom(osHashes, Math.random()));
        await axios.post(`${process.env.TWITTER_URL}/post`, {
            username: process.env.TWITTER_MAIN_USERNAME,
            text: header + `\n\n` + body + `\n` + pickRandom(osHashes, Math.random()),
        });
        await axios.post(`${process.env.LOGGER_URL}/save`, {
            dir: 'twitter-mentions',
            filename: new Date().toISOString().split('T')[0],
            data: top5.map(el => `${el.handle}\n`).join(''),
        });
    }
}