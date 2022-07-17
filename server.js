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
//const browser = new Browser(false);
const accessTokens = new DB('access_tokens');
const states = new Map();

app.use(express.json());

app.get('/activate', async (req, res) => {
    const username = req.query.username;
    const password = req.query.password;
    if (!username || !password) {
        return res.status(400).send('Provide name and pass!');
    }
    // TODO: THIS effectively resets all stored keys
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(process.env.CALLBACK_URL, {
        scope: [
            'tweet.read', 'tweet.write', 'users.read',
            'like.read', 'like.write',
            'follows.read', 'follows.write',
            'offline.access'
        ]
    });
    states.set(state, { username, codeVerifier });
    console.log(username);
    console.log(url);
    res.send(`ok`);

    // AUTO
    //await browser.run(url, username, password);
    // TODO: save id to usernameToId
    //await refreshedClient.v2.me();

    //console.log(JSON.stringify(err));
    //res.set('Content-Type', 'text/html');
    //res.send(Buffer.from(`<a href="${url}">login</a>`));
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
        .then(async ({ client: newClient, accessToken, refreshToken, expiresIn }) => {
            // {loggedClient} is an authenticated client in behalf of some user
            // Store {accessToken} somewhere, it will be valid until {expiresIn} is hit.
            // If you want to refresh your token later, store {refreshToken} (it is present if 'offline.access' has been given as scope)
            const { data: { id } } = await newClient.v2.me();
            console.log(`received ${id}`);
            accessTokens.set(username, { id, accessToken, refreshToken });
            res.send(`ok`);
        })
        .catch((err) => {
            console.log(JSON.stringify(err));
            res.status(403).send(err)
        });
})

app.post('/refresh', async (req, res) => {
    for (const [username, { id, accessToken, refreshToken }] of accessTokens) {
        try {
            const {
                client: refreshedClient,
                accessToken,
                refreshToken: newRefreshToken,
            } = await client.refreshOAuth2Token(refreshToken);
            console.log(`token refreshed for ${username}`);
            accessTokens.set(username, { id: id, accessToken: accessToken, refreshToken: newRefreshToken });
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
    const params = req.body.params;
    if (!username || !text) {
        return res.status(400).json({ status: 'Provide username and text' });
    }
    await makeApiRequest(username, res, async (client) => {
        const { data } = await client.v2.tweet(
            text,
            params
        );
        console.log(`posted ${username}: ${JSON.stringify(data)}`);
        res.json({ status: `ok` });
    });
})

app.get('/search', async (req, res) => {
    const username = req.query.username;
    const query = req.query.q;
    let limit = req.query.limit ?? 50;
    limit = limit < 10 ? 10 : limit; 
    console.log(`Searching for ${query} by ${username}`);
    await makeApiRequest(username, res, async (client) => {
        const jsTweets = await client.v2.search(query, { 'max_results': `${limit}` });
        res.json(jsTweets.tweets);
    });
});

// 100 by default
// 15 requests per 15-minute
app.get('/followers', async (req, res) => {
    const username = req.query.username;
    const userId = req.query.userId;
    if (!username || !userId) {
        return res.status(400).json({ status: 'Provide username and userId' });
    }
    await makeApiRequest(username, res, async (client) => {
        const { data: users } = await client.v2.followers(userId);
        res.json(users);
    });
});

app.get('/id', async (req, res) => {
    const username = req.query.username;
    const twitterHandle = req.query.twitterHandle;
    if (!username || !twitterHandle) {
        return res.status(400).json({ status: 'Provide username and twitterHandle' });
    }
    await makeApiRequest(username, res, async (client) => {
        const { data: { id } } = await client.v2.userByUsername(twitterHandle);
        res.json({ id });
    });
});

app.get('/user', async (req, res) => {
    const username = req.query.username;
    const userId = req.query.userId;
    const params = JSON.parse(req.query.params);
    console.log(params);
    if (!username || !userId) {
        return res.status(400).json({ status: 'Provide username and userId' });
    }
    await makeApiRequest(username, res, async (client) => {
        const { data: user } = await client.v2.user(userId, params);
        res.json(user);
    });
});

app.post('/like', async (req, res) => {
    const username = req.body.username;
    const tweetId = req.body.tweetId;
    if (!username || !tweetId) {
        return res.status(400).json({ status: 'Provide username and tweetId' });
    }
    await makeApiRequest(username, res, async (client, id) => {
        await client.v2.like(id, tweetId);
        console.log(`Liked post ${tweetId} by ${username}`);
        res.json({ status: `ok` });
    });
});

app.post('/follow', async (req, res) => {
    const username = req.body.username;
    const userId = req.body.userId;
    if (!username || !userId) {
        return res.status(400).json({ status: 'Provide username and userId' });
    }
    await makeApiRequest(username, res, async (client, id) => {
        await client.v2.follow(id, userId);
        console.log(`Follow user ${userId} by ${username}`);
        res.json({ status: `ok` });
    });
});

app.post('/unfollow', async (req, res) => {
    const username = req.body.username;
    const userId = req.body.userId;
    if (!username || !userId) {
        return res.status(400).json({ status: 'Provide username and userId' });
    }
    await makeApiRequest(username, res, async (client, id) => {
        await client.v2.unfollow(id, userId);
        console.log(`Unfollow user ${userId} by ${username}`);
        res.json({ status: `ok` });
    });
});


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
})

async function makeApiRequest(username, res, twFn) {
    try {
        const { id, accessToken } = accessTokens.get(username);
        const client = new TwitterApi(accessToken);
        await twFn(client, id);
    } catch (err) {
        console.log(`[ERROR] ${username}: error in twitter request ${JSON.stringify(err)}`);
        res.status(403).json({ status: `no`, err: JSON.stringify(err) });
    }
}

/*
async function testAPI(oldRefreshToken) {
    if (!oldRefreshToken) return;
    try {
        const {
            client: refreshedClient,
            accessToken,
            refreshToken: newRefreshToken,
        } = await client.refreshOAuth2Token(oldRefreshToken);
        //const client = new TwitterApi('<YOUR-ACCESS-TOKEN>');
        const { data: userObject } = await refreshedClient.v2.me();
        console.log(`test ok for ${userObject.name}`);
        return true;
    } catch (err) {
        console.log(`${oldRefreshToken} not active`);
    }
    return false;
}
*/