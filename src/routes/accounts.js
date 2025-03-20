const BaseRouter = require('../interfaces/BaseRouter');
const { authenticate } = require('../middlewares/auth');

class AccountRouter extends BaseRouter {
    async initializeRoutes() {
        this.router.use(authenticate);
        
        this.router.get('/', this.controller.getAll);
        this.router.get('/:id', this.controller.getById);
        this.router.post('/', this.controller.create);
        this.router.patch('/:id', this.controller.update);
        this.router.delete('/:id', this.controller.delete);
        this.router.get('/user/:userId', this.controller.findByUser);
        this.router.patch('/:id/balance', this.controller.updateBalance);
        this.router.patch('/:id/toggle-active', this.controller.toggleActive);
        
        // New routes for managing deleted accounts
        this.router.get('/deleted/all', this.controller.getDeletedAccounts);
        this.router.post('/:id/restore', this.controller.restore);
    }
}

module.exports = AccountRouter; 