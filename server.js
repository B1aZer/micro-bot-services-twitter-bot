require('dotenv').config();

const express = require('express');
const app = express();
const port = 3022;
const DB = require('../_utils/db.js');
const { TwitterApi } = require('twitter-api-v2');
const Browser = require('./puppeteer.js');

const client = new TwitterApi({ clientId: process.env.CLIENT_ID, clientSecret: process.env.CLIENT_SECRET });
const browser = new Browser(false);
const accessTokens = new DB('access_tokens');
const states = new Map();

async function testAPI(oldRefreshToken) {
    if (!oldRefreshToken) return;
    try {
        const {
            client: refreshedClient,
            accessToken,
            refreshToken: newRefreshToken,
        } = await client.refreshOAuth2Token(oldRefreshToken);
        const { data: userObject } = await refreshedClient.v2.me();
        console.log(`test ok for ${userObject.name}`);
        return true;
    } catch (err) {
        console.log(`${oldRefreshToken} not active`);
    }
    return false;
}

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/activate', async (req, res) => {
    const username = req.query.username;
    const password = req.query.password;
    if (!username || !password) {
        return res.status(400).send('Provide name and pass!');
    }
    const accessToken = accessTokens.get(username);
    // TODO: no point, see below
    const active = await testAPI(accessToken);
    if (active) {
        return res.status(400).send('Keys are active!');
    }
    // TODO: THIS effectively resets all stored keys
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(process.env.CALLBACK_URL, { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] });
    states.set(state, { username, codeVerifier });
    try {
        console.log(url);
        //await browser.run(url, username, password);
    } catch (err) {
        console.log(err);
        //res.set('Content-Type', 'text/html');
        //res.send(Buffer.from(`<a href="${url}">login</a>`));
    }
    res.send(`ok`);
});

app.get('/save', async (req, res) => {
    // Extract state and code from query string
    const { state, code } = req.query;
    // Get the saved codeVerifier from session
    const { username, codeVerifier } = states.get(state);

    if (!codeVerifier || !state || !code) {
        return res.status(400).send('You denied the app or your session expired!');
    }

    client.loginWithOAuth2({ code, codeVerifier, redirectUri: process.env.CALLBACK_URL })
        .then(async ({ client: loggedClient, accessToken, refreshToken, expiresIn }) => {
            // {loggedClient} is an authenticated client in behalf of some user
            // Store {accessToken} somewhere, it will be valid until {expiresIn} is hit.
            // If you want to refresh your token later, store {refreshToken} (it is present if 'offline.access' has been given as scope)
            accessTokens.set(username, refreshToken);
            res.send(`ok`);
        })
        .catch((err) => {
            console.log(err);
            res.status(403).send(err)
        });
})

app.post('/refresh', async (req, res) => {;
    for (const [username, oldRefreshToken] of accessTokens) {
        try {
            const {
                client: refreshedClient,
                accessToken,
                refreshToken: newRefreshToken,
            } = await client.refreshOAuth2Token(oldRefreshToken);
            console.log(`token refreshed for ${username}`);
            accessTokens.set(username, newRefreshToken);
        } catch (err) {
            console.log(`not a valid key for ${username}`);
            console.log(err.data);
            continue;
        }
    }
    res.json({ status: `ok` });
})

app.post('/post', async (req, res) => {
    const username = req.body.username;
    const text = req.body.text;
    if (!username || !text) {
        return res.json({ status: 'Provide username and text' });
    }
    const oldRefreshToken = accessTokens.get(username);
    if (!oldRefreshToken) {
        res.status(400).json({ status: `no`, err: `no access token for ${username}` });
        return;
    }
    try {
        const {
            client: refreshedClient,
            accessToken,
            refreshToken: newRefreshToken,
        } = await client.refreshOAuth2Token(oldRefreshToken);
        accessTokens.set(username, newRefreshToken);
        const { data } = await refreshedClient.v2.tweet(
            text
        );
        //console.log(`Posted ${username} content: ${text}`);
        res.json({ status: `ok` });
    } catch (err) {
        res.json({ status: `no`, err: err });
    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
})