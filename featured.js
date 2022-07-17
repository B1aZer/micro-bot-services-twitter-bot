const dotenv = require('dotenv');
dotenv.config();
const axios = require('axios');
const { pickRandom, randomIntFromInterval } = require('../_utils/index.js');

init();

// 50 requests per 15 minutes per endpoint. 

async function init() {
    const { data: [item] } = await axios.get(`${process.env.LOGGER_URL}/get`, {
        params: {
            name: process.env.LOG_WHITELISTS_NAME,
            id: 'recent',
            limit: 1,
            order: 'random',
            notIn: 'twitter-mentions',
            notInIds: [0, 1, 2, 3, 4, 5, 6], // 1 week
            thresh: 10,
        }
    });
    const osHashes = ['#Ethereum', '#NFTs', '#NFT', '#ETH', '#Ethereum', '#NFTProject', '#Mint', ``];
    const date = new Date();
    const month = date.toLocaleString('default', { month: 'long' });
    const day = date.toLocaleDateString("en-GB", {
        day: "2-digit",
    });
    const header = `Featured NFT collection (${month} ${day} EST):`;
    const { data: {id} } = await axios.get(`${process.env.TWITTER_URL}/id`, {
        params: {
            username: process.env.TWITTER_MAIN_USERNAME,
            twitterHandle: `${item.handle.replace('@', '')}`,
        }
    });
    const { data: { description, url } } = await axios.get(`${process.env.TWITTER_URL}/user`, {
        params: {
            username: process.env.TWITTER_MAIN_USERNAME,
            userId: id,
            params: { 'user.fields': ['description', 'profile_image_url', 'url'] },
        }
    });
    /*
    console.log(
        header + `\n\n` +
        `${item.handle} ` +
        `${description.length > 230 ? description.substring(0, 230) + '...' : description}` + `\n\n` +
        url + `\n\n` +
        `${pickRandom(osHashes, Math.random())}`
    );
    */
    await axios.post(`${process.env.TWITTER_URL}/post`, {
        username: process.env.TWITTER_MAIN_USERNAME,
        text: header + `\n\n` +
        `${item.handle} ` +
        `${description.length > 230 ? description.substring(0, 230) + '...' : description}` + `\n\n` +
        url + `\n\n` +
        `${pickRandom(osHashes, Math.random())}`,
    });
    await axios.post(`${process.env.LOGGER_URL}/save`, {
        dir: 'twitter-mentions',
        filename: new Date().toISOString().split('T')[0],
        data: item.handle,
    });
}