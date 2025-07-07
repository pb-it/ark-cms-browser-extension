class Controller {

    _apiController;

    constructor(api) {
        this._apiController = new ApiController(api);
    }

    async init() {
        await this._apiController.initApiController();
        return Promise.resolve();
    }

    getApiController() {
        return this._apiController;
    }
}