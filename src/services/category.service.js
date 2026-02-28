import * as categoryModel from "../models/category.model.js";

const CACHE_TTL = 5 * 60 * 1000;

let categoryCache = {
  level1: null,
  level2: null,
  timestamp: null,
};

export async function getCachedCategories() {
  const now = Date.now();

  if (
    categoryCache.level1 &&
    categoryCache.level2 &&
    categoryCache.timestamp &&
    now - categoryCache.timestamp < CACHE_TTL
  ) {
    return {
      level1: categoryCache.level1,
      level2: categoryCache.level2,
      fromCache: true,
    };
  }

  const level1 = await categoryModel.findLevel1Categories();
  const level2 = await categoryModel.findLevel2Categories();

  categoryCache = {
    level1,
    level2,
    timestamp: now,
  };

  return {
    level1,
    level2,
    fromCache: false,
  };
}

export function clearCategoryCache() {
  categoryCache = {
    level1: null,
    level2: null,
    timestamp: null,
  };
}

export async function getCategoryWithProductCount(id) {
  const category = await categoryModel.findByCategoryId(id);
  if (!category) return null;

  const childrenCount = await categoryModel.countChildrenProducts(id);

  category.product_count =
    parseInt(category.product_count) + parseInt(childrenCount || 0);

  return category;
}
