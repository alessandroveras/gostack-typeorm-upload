import { Router } from 'express';
import { getCustomRepository, getRepository } from 'typeorm';
import manageCategories from '../middlewares/manageCategories';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
// import DeleteTransactionService from '../services/DeleteTransactionService';
// import ImportTransactionsService from '../services/ImportTransactionsService';
import Category from '../models/Category';

const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  // initialize repositories
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  const categoryRepository = getRepository(Category);

  // retrieve all transactions and categories
  const transactions = await transactionsRepository.find();
  const categories = await categoryRepository.find();

  // retrieve balance
  const balance = await transactionsRepository.getBalance();

  // generate the requested transaction-list format
  const extendedTransactions = transactions.map(transaction => {
    // retrieve category of transaction

    const foundCategory = categories.find(
      category => category.id === transaction.category_id,
    ) as Category;
    transaction.category = foundCategory;

    delete transaction.category_id;
    delete transaction.created_at;
    delete transaction.updated_at;
    delete transaction.category.created_at;
    delete transaction.category.updated_at;

    return transaction;
    // append category to transaction
  });

  const extract = {
    transactions: extendedTransactions,
    balance,
  };

  return response.json(extract);
});

transactionsRouter.post('/', manageCategories, async (request, response) => {
  const { title, value, type } = request.body;

  const createTransaction = new CreateTransactionService();

  const { categoryId } = request;

  const transaction = await createTransaction.execute({
    title,
    value,
    type,
    category_id: categoryId,
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
