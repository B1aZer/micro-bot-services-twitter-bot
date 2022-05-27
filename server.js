require('dotenv').config();

const Keyv = require('keyv');
const express = require('express');
const app = express();
const port = 3022;
const currentDir = require('path').dirname(require.main.filename);
const keyv = new Keyv(`sqlite://${currentDir}/database.sqlite`);
const { TwitterApi } = require('twitter-api-v2');
const client = new TwitterApi({ clientId: process.env.CLIENT_ID, clientSecret: process.env.CLIENT_SECRET });

async function testAPI(oldRefreshToken) {
    try {
        const {
            client: refreshedClient,
            accessToken,
            refreshToken: newRefreshToken,
        } = await client.refreshOAuth2Token(oldRefreshToken);
        const { data: userObject } = await refreshedClient.v2.me();
        console.log(userObject);
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
    const accessToken = await keyv.get(username);
    const active = await testAPI(accessToken);
    console.log(active);
    if (active) {
        return res.status(400).send('Keys are active!');
    }
    await keyv.set('usernames', []);
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(process.env.CALLBACK_URL, { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] });
    await keyv.set(state, { username, codeVerifier });
    await keyv.set('usernames', [...(await keyv.get('usernames')), username]);
    res.set('Content-Type', 'text/html');
    res.send(Buffer.from(`<a href="${url}">login</a>`));
});

app.get('/save', async (req, res) => {
    // Extract state and code from query string
    const { state, code } = req.query;
    // Get the saved codeVerifier from session
    const { username, codeVerifier } = await keyv.get(state);

    if (!codeVerifier || !state || !code) {
        return res.status(400).send('You denied the app or your session expired!');
    }

    client.loginWithOAuth2({ code, codeVerifier, redirectUri: process.env.CALLBACK_URL })
        .then(async ({ client: loggedClient, accessToken, refreshToken, expiresIn }) => {
            // {loggedClient} is an authenticated client in behalf of some user
            // Store {accessToken} somewhere, it will be valid until {expiresIn} is hit.
            // If you want to refresh your token later, store {refreshToken} (it is present if 'offline.access' has been given as scope)
            await keyv.set(username, refreshToken);

            res.set('Content-Type', 'text/html');
            res.send(Buffer.from(`ok`));
        })
        .catch((err) => res.status(403).send(err));
})

app.post('/refresh', async (req, res) => {
    const usernames = await keyv.get('usernames') ?? [];
    try {
        for (const username of usernames) {
            const oldRefreshToken = await keyv.get(username);
            const {
                client: refreshedClient,
                accessToken,
                refreshToken: newRefreshToken,
            } = await client.refreshOAuth2Token(oldRefreshToken);
            await keyv.set(username, newRefreshToken);
        }
        usernames.length ? res.json({ status: `ok` }) : res.json({ status: `no`, err: 'empty array' });
    } catch (err) {
        res.json({ status: `no`, err: err });
    }
})

app.post('/post', async (req, res) => {
    const username = req.body.username;
    const text = req.body.text;
    if (!username || !text) {
        return res.json({ status: 'Provide username and text' });
    }
    const oldRefreshToken = await keyv.get(username);
    try {
        const {
            client: refreshedClient,
            accessToken,
            refreshToken: newRefreshToken,
        } = await client.refreshOAuth2Token(oldRefreshToken);
        await keyv.set(username, newRefreshToken);
        const { data } = await refreshedClient.v2.tweet(
            text
        );
        res.json({ status: `ok` });
    } catch (err) {
        res.json({ status: `no`, err: err });
    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
})