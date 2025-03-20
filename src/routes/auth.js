const BaseRouter = require('../interfaces/BaseRouter');

class AuthRouter extends BaseRouter {
    async initializeRoutes() {
        this.router.post('/register', this.controller.register);
        this.router.post('/login', this.controller.login);
        this.router.post('/logout', this.controller.logout);
        this.router.get('/current-user', this.controller.getCurrentUser);
        this.router.post('/change-password', this.controller.changePassword);
    }
}

module.exports = AuthRouter;