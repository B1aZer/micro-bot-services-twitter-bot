const dotenv = require('dotenv');
dotenv.config();
const fs = require('fs');
const axios = require('axios');

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
    const top30 = collectionsUnique.slice(0, 30);
    for (let i = 0; i < top30.length; i++) {
        const el = top30[i];
        const els = el.split(process.env.LOG_FILES_SEPARATOR);
        try {
            await axios.post(`${process.env.TWITTER_URL}`, {
                username: process.env.TWITTER_NEW_USERNAME,
                text: `OpenSea Recently Added Collections:
    
${els[0]}

Contract Address: ${els[5]}

#Opensea #NFT #NFTs #Solana #SolanaNFT #NFTCommunity
    
${els[1]}
`
            });
            // wait 10m
            await new Promise(r => setTimeout(r, 10 * 60000));
        } catch (err) {
            console.log(err);
            continue;
        }
    }
}
