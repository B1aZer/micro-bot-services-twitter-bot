const dotenv = require('dotenv');
dotenv.config();
const axios = require('axios');
const { pickRandom, removeAndReturnRandom, randomIntFromInterval } = require('../_utils/index.js');

init();

async function init() {
    const { data: top20 } = await axios.get(`${process.env.LOGGER_URL}/get`, {
        params: {
            name: process.env.LOG_FOLLOWERS_NAME,
            ids: [0,1,2],
            limit: 20,
            order: 'date',
            groupBy: 5,
            thresh: 100,
        }
    })
    for (let i = 0; i < top20.length; i++) {
        const top5 = top20[i];
        try {
            const osHashes = ['#Ethereum', '#NFTs', '#NFT', '#ETH', '#Ethereum', '#NFTProject', '#Mint', ``];
            const today = new Date();
            const month = today.toLocaleString('default', { month: 'long' });
            const day = today.toLocaleDateString("en-GB", {
                day: "2-digit",
            });
            const header = `Trending NFT accounts (${month} ${day}):`;
            const body = top5.map(el => {
                return `@${el.name}
Created: ${new Date(el.date).toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
})}
Followers: ${el.followers_count}
`;
            }).join('');
            await axios.post(`${process.env.TWITTER_URL}`, {
                username: process.env.TWITTER_MAIN_USERNAME,
                text: header + `\n\n` + body + `\n` + pickRandom(osHashes, Math.random())
            });
            // wait 2-4h
            await new Promise(r => setTimeout(r, randomIntFromInterval(2, 4, Math.random()) * 60000 * 60));
        } catch (err) {
            console.log(err);
            continue;
        }

    }
}
