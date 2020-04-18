import { Request, Response, NextFunction } from 'express';
import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Category from '../models/Category';

export default async function manageCategorie(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { category: requestedCategory } = request.body;

    const categoriesRepository = getRepository(Category);
    const recoveredCategory = await categoriesRepository.findOne({
      where: { title: requestedCategory },
    });

    try {
      if (!recoveredCategory) {
        const newCategory = categoriesRepository.create({
          title: requestedCategory,
        });

        const { id } = newCategory;
        request.categoryId = id;

        await categoriesRepository.save(newCategory);

        return next();
      }
    } catch {
      throw new AppError('New Category could not be created properly', 500);
    }

    if (recoveredCategory) {
      const { id } = recoveredCategory;
      request.categoryId = id;
      return next();
    }
  } catch {
    throw new AppError('Categories cound not be handled properly', 404);
  }
  return next();
}
