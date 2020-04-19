import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';

interface RequestDTO {
  id: string;
}
class DeleteTransactionService {
  public async execute({ id }: RequestDTO): Promise<void> {
    const transactionsRepository = getRepository(Transaction);

    const transaction = await transactionsRepository.findOne({ where: { id } });
    if (!transaction) {
      throw new AppError(`Transaction with id ${id} does not exist`, 400);
    }
    await transactionsRepository.remove(transaction);
  }
}

export default DeleteTransactionService;
