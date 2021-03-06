const dotenv = require('dotenv');
dotenv.config();
const axios = require('axios');
const { pickRandom, removeAndReturnRandom, randomIntFromInterval } = require('../_utils/index.js');

init();

async function init() {
    const { data: top10 } = await axios.get(`${process.env.LOGGER_URL}/get`, {
        params: {
            name: process.env.LOG_NAME,
            id: 'recent',
            limit: 10,
            order: 'followers_count',
            groupBy: 5,
        }
    })

    for (let i = 0; i < top10.length; i++) {
        const top5 = top10[i];
        const osHashes = ['#Ethereum', '#NFTs', '#ETH', '#Ethereum', '#NFTProject', '#Mint', ``];
        const tomorrowDate = new Date();
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const month = tomorrowDate.toLocaleString('default', { month: 'long' });
        const day = tomorrowDate.toLocaleDateString("en-GB", {
            day: "2-digit",
        });
        const header = `Top mints for Tomorrow (${month} ${day} EST):`;
        const body = top5.map(el => {
            return `${el.handle}
Mint: ${new Date(el.date).toLocaleString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
})}
Followers: ${el.followers_count}
`;
        }).join('');
        await axios.post(`${process.env.TWITTER_URL}/post`, {
            username: process.env.TWITTER_MAIN_USERNAME,
            text: header + `\n\n` + body + `\n` + `${pickRandom(osHashes, Math.random())} #NFT`,
        });
        await axios.post(`${process.env.LOGGER_URL}/save`, {
            dir: 'twitter-mentions',
            filename: new Date().toISOString().split('T')[0],
            data: top5.map(el => `${el.handle}\n`).join(''),
        });
        // wait 10-20m
        await new Promise(r => setTimeout(r, randomIntFromInterval(10, 20, Math.random()) * 60000));

    }
}
