import { getCustomRepository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

import AppError from '../errors/AppError';

export enum TransactionType {
  INCOME = 'income',
  OUTCOME = 'outcome',
}

interface RequestDTO {
  title: string;
  value: number;
  type: TransactionType;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: RequestDTO): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const balance = await transactionsRepository.getBalance();

    // validates transaction type
    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Transaction Type is not valid', 401);
    }

    // validates if transaction has credit to be fufilled
    if (type === 'outcome' && value > balance.total) {
      throw new AppError('Not enough balance to fullfill the transaction', 400);
    }

    // handles category creation or retrieval
    let transactionCategory = await categoriesRepository.findOne({
      where: { title: category },
    });

    try {
      if (!transactionCategory) {
        transactionCategory = categoriesRepository.create({
          title: category,
        });

        await categoriesRepository.save(transactionCategory);
      }
    } catch {
      throw new AppError('New Category could not be created properly', 500);
    }

    // create transaction
    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: transactionCategory,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
