class BookmarkController {

    static parse(item) {
        var obj = {};
        //debugger;
        if (item['title'])
            obj['title'] = item['title'];
        if (item['url'])
            obj['url'] = item['url'];
        if (item['children']) {
            obj['children'] = [];
            for (const child of item['children']) {
                obj['children'].push(BookmarkController.parse(child));
            }
        }
        return obj;
    }

    static download(obj) {
        var a = document.createElement('a');
        var file = new Blob([JSON.stringify(obj, null, '\t')], { type: 'text/json' });
        a.href = URL.createObjectURL(file);
        a.download = 'x.json';
        a.click();
    }

    static searchTree(element, matchingTitle) {
        if (element.title == matchingTitle) {
            return element;
        } else if (element.children != null) {
            var i;
            var result = null;
            for (i = 0; result == null && i < element.children.length; i++) {
                result = BookmarkController.searchTree(element.children[i], matchingTitle);
            }
            return result;
        }
        return null;
    }

    static async clear(obj) {
        if (obj && obj.children && obj.children.length > 0) {
            for (var elem of obj.children) {
                if (elem.type == 'folder')
                    await browser.bookmarks.removeTree(elem.id);
                else
                    await browser.bookmarks.remove(elem.id);
            }
        }
        return Promise.resolve();
    }

    static async create(parent, obj) {
        if (Array.isArray(obj)) {
            for (var x of obj) {
                await BookmarkController.create(parent, x);
            }
        } else {
            var tmp = { parentId: parent };
            if (obj['title'])
                tmp['title'] = obj['title'];
            if (obj['url']) {
                if (obj['url'] == 'data:')
                    tmp['type'] = 'separator';
                else
                    tmp['url'] = obj['url'];
            }
            var bm = await browser.bookmarks.create(tmp);
            if (obj.children) {
                for (var x of obj.children) {
                    await BookmarkController.create(bm['id'], x);
                }
            }
        }
        return Promise.resolve();
    }

    _bChrome;
    _root;

    constructor() {
        this._bChrome = (typeof browser == "undefined");
        if (this._bChrome)
            this._root = 'Lesezeichenleiste';
        else
            this._root = 'Lesezeichen-Symbolleiste';
    }

    async export(url, profile) {
        const tree = await browser.bookmarks.getTree();
        var obj = BookmarkController.parse(tree[0]);
        obj = BookmarkController.searchTree(obj, this._root);
        const data = {
            'profile': profile,
            'dump': JSON.stringify(obj)
        }
        if (this._bChrome)
            ;
        else
            await HttpClient.request('POST', url, { 'withCredentials': true }, data);
        window.close();
        return Promise.resolve();
    }

    async import(url) {
        var obj;
        var response = await HttpClient.request('GET', url, { 'withCredentials': true });
        if (response) {
            var tmp = JSON.parse(response);
            var data = tmp['data'];
            if (data && data.length == 1)
                obj = data[0];
        }
        if (obj) {
            //console.log(obj['dump']);
            var tree = await browser.bookmarks.getTree();
            tree = BookmarkController.searchTree(tree[0], this._root);
            await BookmarkController.clear(tree);
            await BookmarkController.create(tree['id'], obj['dump'].children);
        }
        window.close();
        return Promise.resolve();
    }
}