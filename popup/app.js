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

    static async checkLogin(host) {
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
            xhr.open("GET", host + "/sys/info", true);
            xhr.send();
        });
    }

    _host;
    _extensions;
    _bookmarkController;

    constructor() {
    }

    getHost() {
        return this._host;
    }

    async init() {
        const $div = $('div#popup-content');
        $div.empty();
        var tmp = await browser.storage.sync.get('host');
        //var tmp = await browser.storage.managed.get('host'); //browser.storage.local
        this._host = tmp['host'];
        if (this._host) {
            var login = await App.checkLogin(this._host);
            if (login) {
                await loadScript('https://cdn.jsdelivr.net/gh/pb-it/ark-cms@latest/public/js/common/http-client.js');

                var response = await HttpClient.request('GET', this._host + '/api/data/v1/_extension', { 'withCredentials': true });
                if (response)
                    this._extensions = JSON.parse(response)['data'];

                if (this._extensions) {
                    for (var extension of this._extensions) {
                        if (extension['name'] === 'browser-bookmarks')
                            this._bookmarkController = new BookmarkController();
                    }
                }

                if (this._bookmarkController) {
                    $div.append('<h2>Bookmarks:</h2>');
                    $div.append('Profile: ');
                    var $profile = $('<input>')
                        .attr('id', 'profile');
                    $div.append($profile);
                    $div.append('<br>');
                    var $export = $('<button>')
                        .text('Export')
                        .click(async function (event) {
                            event.stopPropagation();
                            var profile = document.querySelector("#profile").value;
                            var url = this._host + '/api/data/v1/browser-bookmarks';
                            return this._bookmarkController.export(url, profile);
                        }.bind(this));
                    $div.append($export);
                    $div.append('<br/>');
                    var $import = $('<button>')
                        .text('Import')
                        .click(async function (event) {
                            event.stopPropagation();
                            var profile = document.querySelector("#profile").value;
                            var url = this._host + '/api/data/v1/browser-bookmarks?profile=' + profile + '&_sort=created_at:desc&_limit=1';
                            return this._bookmarkController.import(url);
                        }.bind(this));
                    $div.append($import);
                } else
                    $div.append('Add \'browser-bookmarks\' extension to your ARK-CMS application to manage your bookmarks here!');
            } else {
                $div.append('Login:<br><a href="' + this._host + '">' + this._host + '</a>');
                var $reset = $('<button>')
                    .text('Reset')
                    .click(async function (event) {
                        event.stopPropagation();
                        await browser.storage.sync.set({
                            host: ''
                        });
                        return this.init();
                    }.bind(this));
                $div.append($reset);
                var $reload = $('<button>')
                    .text('Reload')
                    .click(async function (event) {
                        event.stopPropagation();
                        return this.init();
                    }.bind(this));
                $div.append($reload);
            }
        } else {
            $div.append('Host: ');
            var $input = $('<input>')
                .attr('id', 'host');
            $div.append($input);
            var $apply = $('<button>')
                .text('Apply')
                .click(async function (event) {
                    event.stopPropagation();

                    await browser.storage.sync.set({
                        host: document.querySelector("#host").value
                    });
                    return this.init();
                }.bind(this));
            $div.append($apply);
        }
        return Promise.resolve();
    }
}