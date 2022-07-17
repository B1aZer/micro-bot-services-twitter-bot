const dotenv = require('dotenv');
dotenv.config();
const twitterV1Client = require('../_utils/twitter.js');
const axios = require('axios');
const { pickRandom, removeAndReturnRandom, randomIntFromInterval } = require('../_utils/index.js');
const mimeTypes = {
    'jpg': 'image/jpeg',
    'png': 'image/png',
    'svg': 'image/svg+xml',
    'jpeg': 'image/jpeg',
    'tif': 'image/tif',
    'tiff': 'image/tif'
}

init();

async function init() {
    const { data: { image: url } } = await axios.get(`${process.env.REDDIT_URL}/meme`);
    const extn = url.split('.')[url.split('.').length - 1];
    console.log(extn);
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, "utf-8");
    console.log(buffer);
    console.log(mimeTypes[extn]);
    const mediaId = await twitterV1Client.v1.uploadMedia(buffer, { mimeType: mimeTypes[extn] });
    console.log(mediaId);
    await axios.post(`${process.env.TWITTER_URL}/post`, {
        username: process.env.TWITTER_MEMES_USERNAME,
        text: '',
        params: { media_ids: mediaId }
    });
}