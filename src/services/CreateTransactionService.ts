import { getCustomRepository } from 'typeorm';

import Transaction from '../models/Transaction';
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
  category_id: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category_id,
  }: RequestDTO): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const balance = await transactionsRepository.getBalance();

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Transaction Type is not valid', 401);
    }

    if (type === 'outcome' && value > balance.total) {
      throw new AppError('Not enough balance to fullfill the transaction', 400);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
