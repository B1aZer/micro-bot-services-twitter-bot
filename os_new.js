const dotenv = require('dotenv');
dotenv.config();
const fs = require('fs');
const axios = require('axios');
const { pickRandom, removeAndReturnRandom, randomIntFromInterval } = require('../_utils/index.js');

const path = process.env.OS_PATH;

init();

async function init() {
    const command_files = fs.readdirSync(path).reverse();
    const log = fs.readFileSync(`${path}/${command_files[0]}`, 'utf8');
    const collections = log.split('\n');
    const filteredCollections = collections.filter((col) => {
        return col.split(process.env.LOG_FILES_SEPARATOR)[5]?.trim();
    })
    const collectionsUnique = [...new Set(filteredCollections)];
    const top30 = collectionsUnique.slice(0, 20);
    for (let i = 0; i < top30.length; i++) {
        const el = top30[i];
        const els = el.split(process.env.LOG_FILES_SEPARATOR);
        try {
            const osHashes = ['#opensea', '#NFTs', '#SolanaNFT', '#Solana', '#NFTProject', '#NFTCommunity'];
            const lines = [`Contract Address: ${els[5]}`, `Contract Reference: ${els[5]}`, `Contract: ${els[5]}`, ``];
            await axios.post(`${process.env.TWITTER_URL}`, {
                username: process.env.TWITTER_NEW_USERNAME,
                text: `${els[0]}

${removeAndReturnRandom(lines, Math.random())}

${pickRandom(osHashes, Math.random())} #NFT
    
${els[1]}
`
            });
            // wait 5-15m
            await new Promise(r => setTimeout(r, randomIntFromInterval(5, 18, Math.random()) * 60000));
        } catch (err) {
            console.log(err);
            continue;
        }
    }
}
