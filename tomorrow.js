const dotenv = require('dotenv');
dotenv.config();
const axios = require('axios');
const { pickRandom, removeAndReturnRandom, randomIntFromInterval } = require('../_utils/index.js');

init();

async function init() {
    const { data: top5 } = await axios.get(`${process.env.LOGGER_URL}/get`, {
        params: {
            name: process.env.LOG_NAME,
            id: 'recent',
            limit: 5,
            order: 'followers_count'
        }
    })

    for (let i = 0; i < top5.length; i++) {
        const el = top5[i];
        try {
            const osHashes = ['#Ethereum', '#NFTs', '#NFT', '#ETH', '#Ethereum', '#NFTProject', '#Mint', ``];
            const lines = [`Don't miss out!`, `Check it out!`, `Mark you calendars!`, `Prepare!`, `Get ready!`];
            await axios.post(`${process.env.TWITTER_URL}`, {
                username: process.env.TWITTER_USERNAME,
                text: `${el.name} @${el.link.split('/')[el.link.split('/').length - 1]}

Will be minted on ${new Date(el.date).toString()}.

${removeAndReturnRandom(lines, Math.random())}

${pickRandom(osHashes, Math.random())}
    
${el.link}
`
            });
            // wait 2-4h
            await new Promise(r => setTimeout(r, randomIntFromInterval(2, 4, Math.random()) * 60000 * 60));
        } catch (err) {
            console.log(err);
            continue;
        }
    }
}
