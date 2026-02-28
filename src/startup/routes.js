import homeRouter from '../routes/home.route.js';
import productRouter from '../routes/product.route.js';
import accountRouter from '../routes/account.route.js';
import adminCategoryRouter from '../routes/admin/category.route.js';
import adminUserRouter from '../routes/admin/user.route.js';
import adminAccountRouter from '../routes/admin/account.route.js';
import adminProductRouter from '../routes/admin/product.route.js';
import adminSystemRouter from '../routes/admin/system.route.js';
import sellerRouter from '../routes/seller.route.js';

import { isAuthenticated, isSeller, isAdmin } from '../middlewares/auth.mdw.js';
import * as categoryModel from '../models/category.model.js';

export default function (app) {
    // Category API (Moved from index.js)
    app.get('/api/categories', async (req, res) => {
        try {
            const categories = await categoryModel.findAll();
            const categoriesWithLevel = categories.map(cat => ({
                ...cat,
                level: cat.parent_id ? 2 : 1
            }));
            res.json({ categories: categoriesWithLevel });
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ error: 'Failed to load categories' });
        }
    });

    // Admin Routes Grouping
    const adminRouter = (path, router) => {
        app.use(`/admin/${path}`, isAdmin, (req, res, next) => {
            res.locals.isAdminMode = true;
            next();
        }, router);
    };

    adminRouter('account', adminAccountRouter);
    adminRouter('users', adminUserRouter);
    adminRouter('categories', adminCategoryRouter);
    adminRouter('products', adminProductRouter);
    adminRouter('system', adminSystemRouter);

    // Seller Routes
    app.use('/seller', isAuthenticated, isSeller, sellerRouter);

    // General Routes
    app.use('/', homeRouter);
    app.use('/products', productRouter);
    app.use('/account', accountRouter);
}
