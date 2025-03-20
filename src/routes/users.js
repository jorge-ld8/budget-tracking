const BaseRouter = require('../interfaces/BaseRouter');
const { authenticate } = require('../middlewares/auth');

class UsersRouter extends BaseRouter {
    async initializeRoutes() {
        this.router.use(authenticate);

        this.router.get('/', this.controller.getAll);
        this.router.get('/:id', this.controller.getById);
        this.router.post('/', this.controller.create);
        this.router.patch('/:id', this.controller.update);
        this.router.delete('/:id', this.controller.delete);
    }
}

module.exports = UsersRouter;