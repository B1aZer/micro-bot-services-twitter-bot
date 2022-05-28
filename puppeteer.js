const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

module.exports = class Browser {
    constructor(headless = true) {
        this.headless = headless;
    }
    async run(url, username, password) {
        const browser = await puppeteer.launch({ headless: this.headless });
        const page = await browser.newPage();

        puppeteer.use(StealthPlugin())

        // open twitter
        await page.goto('https://twitter.com/login', {
            waitUntil: 'networkidle0',
        });
    
        // Login
        await page.type('input[name="text"]', username, { delay: 100 });

        let buttons = await page.$$('div[role="button"]');
        let nextBtn = buttons[2];
        await nextBtn.click();
        await page.waitForTimeout(1000);
       
        await page.type('input[name="password"]', password, { delay: 100 });

        buttons = await page.$$('div[role="button"]');
        nextBtn = buttons[2];
        await nextBtn.click();
        await page.waitForTimeout(3000);

        await page.goto(url, {
            waitUntil: 'networkidle0',
        });

        buttons = await page.$$('div[role="button"]');
        nextBtn = buttons[0];
        await nextBtn.click();

        await browser.close()
    }
}
