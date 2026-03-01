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

import db from '../utils/db.js';

export async function getCategoryWithProductCount(category, id) {
  if (!category) return null;

  // Nếu category có con (level 1), cộng thêm product_count của các category con
  const childrenCount = await db('categories as child')
    .leftJoin('products as p', 'child.id', 'p.category_id')
    .where('child.parent_id', id)
    .count('p.id as total')
    .first();

  // Tổng = product_count của chính nó + product_count của con
  category.product_count = parseInt(category.product_count) + parseInt(childrenCount?.total || 0);

  return category;
}
