require('dotenv').config();

const express = require('express');
const app = express();
const port = 3022;
const DB = require('../_utils/db.js');
const { TwitterApi } = require('twitter-api-v2');
const Browser = require('./puppeteer.js');
//ERROR HANDLING
const { transporter, mailOptions } = require('../_utils/mail.js');
process.on('uncaughtException', err => {
    console.log('There was an uncaught error', err);
    // send mail with defined transport object
    mailOptions.subject = '✖ Twitter Server Has Crashed ✖';
    mailOptions.text = JSON.stringify(err);
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
        process.exit(1);
    });
});

const client = new TwitterApi({ clientId: process.env.CLIENT_ID, clientSecret: process.env.CLIENT_SECRET });
const browser = new Browser(false);
const accessTokens = new DB('access_tokens');
const states = new Map();
// TODO: update ids if new clients
// save Ids on save, make me request
const usernameToId = generateUsernameToId();

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
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(process.env.CALLBACK_URL, {
        scope: [
            'tweet.read', 'tweet.write', 'users.read',
            'like.read', 'like.write', 'follows.read', 'follows.write',
            'offline.access'
        ]
    });
    states.set(state, { username, codeVerifier });
    try {
        console.log(username);
        console.log(url);
        // AUTO
        //await browser.run(url, username, password);
        // TODO: save id to usernameToId
        //await refreshedClient.v2.me();
    } catch (err) {
        //console.log(JSON.stringify(err));
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
            console.log(JSON.stringify(err));
            res.status(403).send(err)
        });
})

app.post('/refresh', async (req, res) => {
    ;
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
            console.log(JSON.stringify(err));
            continue;
        }
    }
    res.json({ status: `ok` });
})

app.post('/post', async (req, res) => {
    const username = req.body.username;
    const text = req.body.text;
    if (!username || !text) {
        return res.status(400).json({ status: 'Provide username and text' });
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
        console.log(`posted: ${JSON.stringify(data)}`);
        //console.log(`Posted ${username} content: ${text}`);
        res.json({ status: `ok` });
    } catch (err) {
        console.log(`[ERROR]: ${JSON.stringify(err)}`);
        res.status(403).json({ status: `no`, err: JSON.stringify(err) });
    }
})

app.get('/search', async (req, res) => {
    const username = req.query.username;
    const query = req.query.q;
    let limit = req.query.limit ?? 50;
    limit = limit < 10 ? 10 : limit;
    const oldRefreshToken = accessTokens.get(username);
    if (!oldRefreshToken) {
        res.status(400).json({ status: `no`, err: `no access token for ${username}` });
        return;
    }
    const { refreshedClient, newRefreshToken } = await refreshToken(oldRefreshToken);
    if (!newRefreshToken) {
        res.status(400).json({ status: `no`, err: `token was not refreshed for for ${username}` });
        return;
    }
    accessTokens.set(username, newRefreshToken);
    try {
        console.log(`Searched for ${query} by ${username}`);
        const jsTweets = await refreshedClient.v2.search(query, { 'max_results': `${limit}` });
        res.json(jsTweets.tweets);
    } catch (err) {
        console.log(`[ERROR]: ${JSON.stringify(err)}`);
        res.status(403).json({ status: `no`, err: JSON.stringify(err) });
    }
});

app.post('/like', async (req, res) => {
    const username = req.body.username;
    const tweetId = req.body.tweetId;
    if (!username || !tweetId) {
        return res.status(400).json({ status: 'Provide username and tweetId' });
    }
    const oldRefreshToken = accessTokens.get(username);
    if (!oldRefreshToken) {
        res.status(400).json({ status: `no`, err: `no access token for ${username}` });
        return;
    }
    const userId = usernameToId[username];
    // error is handled by express
    const { refreshedClient, newRefreshToken } = await refreshToken(oldRefreshToken);
    if (!newRefreshToken) {
        res.status(400).json({ status: `no`, err: `token was not refreshed for for ${username}` });
        return;
    }
    accessTokens.set(username, newRefreshToken);
    try {
        const resp = await refreshedClient.v2.like(userId, tweetId);
        console.log(`Liked post ${tweetId} by ${username}`);
    } catch (err) {
        // do not break, if post is missing or something
        console.log(`[ERROR]: ${JSON.stringify(err)}`);
    }
    res.json({ status: `ok` });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
})

async function refreshToken(oldRefreshToken) {
    try {
        const {
            client: refreshedClient,
            accessToken,
            refreshToken: newRefreshToken,
        } = await client.refreshOAuth2Token(oldRefreshToken);
        return { refreshedClient, newRefreshToken };
    } catch (err) {
        // TODO: most likely a race condition where newer token already received on other req
        // let's try tp silently continue
        console.log(`[ERROR]: ${JSON.stringify(err)}`);
        // not handled by express for some reason
        //throw new Error('Token was not refreshed!'); 
        return { refreshedClient: null, newRefreshToken: null };
    }

}

function generateUsernameToId() {
    return {
        goodeefi: '1508796104254578690',
        GooDeeBotMint: '154867616',
        GooDeeBotNew: '155234970',
        GooDeeBotOS: '143489628',
        GooDeeBotLeg1: '1529844550977699841',
        GooDeeBotLeg2: '1529909334032924673',
        GooDeeBotLeg3: '1529909870044008470'
    }
}