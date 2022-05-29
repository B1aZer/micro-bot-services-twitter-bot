const dotenv = require('dotenv');
dotenv.config();
const fs = require('fs');
const axios = require('axios');

const path = process.env.MINT_PATH;

init();

async function init() {
    const command_files = fs.readdirSync(path).reverse();
    const log = fs.readFileSync(`${path}/${command_files[0]}`, 'utf8');
    const top5rev = log.split('\n').slice(0, 5);
    const top5 = top5rev.reverse();
    for (let i = 0; i < top5.length; i++) {
        const el = top5[i];
        const els = el.split(process.env.LOG_FILES_SEPARATOR);
        try {
            await axios.post(`${process.env.TWITTER_URL}`, {
                username: process.env.TWITTER_USERNAME,
                text: `Ethereum Top Minted Collection Right Now:
    
${els[0]}

Mints: ${els[1]}

#Ethereum #NFT #NFTs #NFTProject #ETH #Mint
    
${els[2]}
`
            });
            // wait 5m
            await new Promise(r => setTimeout(r, 5 * 60000));
        } catch (err) {
            console.log(err);
            continue;
        }
    }
}
