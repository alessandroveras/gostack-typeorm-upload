import { Router } from 'express';
import multer from 'multer';

import { getCustomRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

// multer settings
import uploadConfig from '../config/upload';

const upload = multer(uploadConfig);

const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  // initialize repositories
  const transactionsRepository = getCustomRepository(TransactionsRepository);

  // get balance
  const balance = await transactionsRepository.getBalance();

  // método com o uso do map pra fazer o enriquecimento das transactions
  // retrieve all transactions
  // const transactions = await transactionsRepository.find({
  //   select: ['id', 'title', 'value', 'type'],
  //   relations: ['category'],
  // });

  // format transactions
  // const extendedTransactions = transactions.map(transaction => {
  //   delete transaction.category.created_at;
  //   delete transaction.category.updated_at;

  //   return transaction;
  // });

  // metodo utilizando as funçoes do banco para fazer o join das tabelas
  const transactions = await transactionsRepository
    .createQueryBuilder('transaction')
    .leftJoinAndSelect('transaction.category', 'category')
    .select([
      'transaction.id',
      'transaction.title',
      'transaction.value',
      'transaction.type',
      'category.id',
      'category.title',
    ])
    .getMany();

  const extract = {
    transactions,
    balance,
  };

  return response.json(extract);
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const createTransaction = new CreateTransactionService();

  const transaction = await createTransaction.execute({
    title,
    value,
    type,
    category,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const deleteTransaction = new DeleteTransactionService();
  await deleteTransaction.execute({ id });

  return response.status(204).send();
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const importTransactions = new ImportTransactionsService();

    const transactions = await importTransactions.execute(request.file.path);

    return response.json(transactions);
  },
);

export default transactionsRouter;
