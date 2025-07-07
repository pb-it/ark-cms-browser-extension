class Scraper {

    constructor() {
    }

    async scrape() {
        var tab;
        const tabs = await browser.tabs.query({ currentWindow: true, active: true });
        if (tabs)
            tab = tabs[0];
        if (tab) {
            console.log(tab.url);
            const domain = new URL(tab.url).host;

            /*await browser.tabs.executeScript({
                code: `console.log('location:', window.location.href);`
            });*/

            var rule;
            var tmp = await app.getController().getApiController().getApiClient().requestData('GET', 'scraper?domain=' + domain);
            if (tmp && tmp.length == 1)
                rule = tmp[0];
            if (rule && rule['funcScrape']) {
                const body = await browser.tabs.sendMessage(tab.id, { 'req': 'source-code' });
                const parser = new DOMParser();
                const doc = parser.parseFromString(body, 'text/html');

                const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
                var fn = new AsyncFunction('url', 'doc', 'options', rule['funcScrape']);
                var data = await fn(tab.url, doc);
                console.log(data);
            }
        }
        return Promise.resolve();
    }
}