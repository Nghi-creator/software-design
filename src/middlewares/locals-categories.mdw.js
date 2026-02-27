import { getCachedCategories } from '../services/category.service.js';

export default async function localsCategoriesMiddleware(req, res, next) {
  const { level1, level2, fromCache } = await getCachedCategories();

  if (!fromCache) {
    console.log('Categories loaded from database');
  }

  res.locals.lcCategories1 = level1;
  res.locals.lcCategories2 = level2;
  next();
}
