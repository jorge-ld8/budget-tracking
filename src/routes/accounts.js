const BaseRouter = require('../interfaces/BaseRouter');

class AccountRouter extends BaseRouter {
    async initializeRoutes() {
        this.router.get('/', this.controller.getAll);
        this.router.get('/:id', this.controller.getById);
        this.router.post('/', this.controller.create);
        this.router.patch('/:id', this.controller.update);
        this.router.delete('/:id', this.controller.delete);
        this.router.get('/user/:userId', this.controller.findByUser);
        this.router.patch('/:id/balance', this.controller.updateBalance);
        this.router.patch('/:id/toggle-active', this.controller.toggleActive);
    }
}

module.exports = AccountRouter; 