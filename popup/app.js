var app;

$(document).ready(async function () {
    app = new App();
    await app.init();
    return Promise.resolve();
});

async function loadScript(url) {
    return new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.async = false;

        script.onload = () => resolve();
        script.onerror = function (err) {
            alert("Error while loading '" + url + "'");
            //console.error(err);
            reject(err);
        }
        //script.onreadystatechange

        document.head.append(script);
    });
}

class App {

    static async checkLogin(api) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.onerror = reject;
            xhr.onreadystatechange = function () {
                if (this.readyState == 4) {
                    /*if (this.status == 200)
                        xhr.responseText;*/
                    resolve(this.status == 200);
                }
            };
            xhr.withCredentials = true;
            xhr.open("GET", api + "/sys/info", true);
            xhr.send();
        });
    }

    _api;
    _extensions;
    _bookmarkController;

    constructor() {
    }

    async init() {


        const $div = $('div#popup-content');
        $div.empty();
        var tmp = await browser.storage.sync.get('api');
        //var tmp = await browser.storage.managed.get('api'); //browser.storage.local
        this._api = tmp['api'];
        if (this._api) {
            var login = await App.checkLogin(this._api);
            if (login) {
                const scripts = [];
                scripts.push(loadScript('https://cdn.jsdelivr.net/gh/pb-it/ark-cms@latest/public/js/controller/api-client.js'));
                scripts.push(loadScript('https://cdn.jsdelivr.net/gh/pb-it/ark-cms@latest/public/js/controller/api-controller.js'));
                scripts.push(loadScript('https://cdn.jsdelivr.net/gh/pb-it/ark-cms@latest/public/js/common/http-client.js'));
                await Promise.all(scripts);

                this._controller = new Controller(this._api);
                await this._controller.init();

                this._extensions = await this._controller.getApiController().getApiClient().requestData('GET', '_extension');
                if (this._extensions) {
                    for (var extension of this._extensions) {
                        if (extension['name'] === 'scraper')
                            this._scraper = new Scraper();
                        if (extension['name'] === 'browser-bookmarks')
                            this._bookmarkController = new BookmarkController();
                    }
                }

                $div.append('<h2>Scraper:</h2>');
                if (this._scraper) {
                    var $scrape = $('<button>')
                        .text('Scrape')
                        .click(async function (event) {
                            event.stopPropagation();
                            await this._scraper.scrape();
                            await browser.tabs.create({
                                url: this._api
                            });
                            window.close();
                            return Promise.resolve();
                        }.bind(this));
                    $div.append($scrape);
                } else
                    $div.append('Add \'scraper\' extension to your ARK-CMS application to scrape websites!');

                $div.append('<h2>Bookmarks:</h2>');
                if (this._bookmarkController) {
                    $div.append('Profile: ');
                    var $profile = $('<input>')
                        .attr('id', 'profile')
                        .val('Profile1');
                    $div.append($profile);
                    $div.append('<br>');
                    var $export = $('<button>')
                        .text('Export')
                        .click(async function (event) {
                            event.stopPropagation();
                            var profile = document.querySelector("#profile").value;
                            var url = this._api + '/api/data/v1/browser-bookmarks';
                            return this._bookmarkController.export(url, profile);
                        }.bind(this));
                    $div.append($export);
                    $div.append('<br/>');
                    var $import = $('<button>')
                        .text('Import')
                        .click(async function (event) {
                            event.stopPropagation();
                            var profile = document.querySelector("#profile").value;
                            var url = this._api + '/api/data/v1/browser-bookmarks?profile=' + profile + '&_sort=created_at:desc&_limit=1';
                            return this._bookmarkController.import(url);
                        }.bind(this));
                    $div.append($import);
                } else
                    $div.append('Add \'browser-bookmarks\' extension to your ARK-CMS application to manage your bookmarks here!');
            } else {
                $div.append('API:<br><a href="' + this._api + '">' + this._api + '</a>');
                var $login = $('<button>')
                    .text('Login')
                    .click(async function (event) {
                        event.stopPropagation();
                        await browser.tabs.create({
                            url: this._api
                        });
                        window.close();
                        return Promise.resolve();
                    }.bind(this));
                $div.append($login);
                var $reset = $('<button>')
                    .text('Reset')
                    .click(async function (event) {
                        event.stopPropagation();
                        await browser.storage.sync.set({
                            api: ''
                        });
                        return this.init();
                    }.bind(this));
                $div.append($reset);
            }
        } else {
            $div.append('API: ');
            var $input = $('<input>')
                .attr('id', 'api');
            $div.append($input);
            var $apply = $('<button>')
                .text('Apply')
                .click(async function (event) {
                    event.stopPropagation();

                    await browser.storage.sync.set({
                        api: document.querySelector("#api").value
                    });
                    return this.init();
                }.bind(this));
            $div.append($apply);
        }
        return Promise.resolve();
    }

    getController() {
        return this._controller;
    }
}