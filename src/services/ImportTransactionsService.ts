import { getRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

export enum TransactionType {
  INCOME = 'income',
  OUTCOME = 'outcome',
}
interface CSVTransaction {
  title: string;
  type: TransactionType;
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const contactsReadStream = fs.createReadStream(filePath);

    const parsers = csvParse({
      delimiter: ',',
      from_line: 2,
    });

    const parseCSV = contactsReadStream.pipe(parsers);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value || !category) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });
    // promisse to wait for end event, and garantee that nexts comands only get
    // executed after promisse is resolved
    await new Promise(resolve => parseCSV.on('end', resolve));

    // initialize repositories
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getRepository(Transaction);

    // finds all categories that exists in the database that matches
    // the categories array
    const existentCategories = await categoriesRepository.find({
      where: { title: In(categories) },
    });

    // take only the titles of the object existentCategoriesTitles
    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    // check the titles from array category that does not exist in the database
    // also remove duplicated values
    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    // insert new categories in the database, taking only the title
    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );
    await categoriesRepository.save(newCategories);

    // create a collection of existent categories and the new ones created by
    // the csv import
    const finalCategories = [...newCategories, ...existentCategories];

    // create the transactions on the database
    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
