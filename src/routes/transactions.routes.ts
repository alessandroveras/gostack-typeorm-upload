import { Router } from 'express';
import manageCategories from '../middlewares/manageCategories';

// import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
// import DeleteTransactionService from '../services/DeleteTransactionService';
// import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();

// transactionsRouter.get('/', async (request, response) => {
//   // TODO
// });

transactionsRouter.post('/', manageCategories, async (request, response) => {
  const { title, value, type } = request.body;

  const createTransaction = new CreateTransactionService();

  const { categoryId } = request;

  const transaction = await createTransaction.execute({
    title,
    value,
    type,
    category: categoryId,
  });

  return response.json(transaction);
});

// transactionsRouter.delete('/:id', async (request, response) => {
//   // TODO
// });

// transactionsRouter.post('/import', async (request, response) => {
//   // TODO
// });

export default transactionsRouter;
