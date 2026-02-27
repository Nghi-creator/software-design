import 'dotenv/config';
import express from 'express';
import { engine } from 'express-handlebars';
import session from 'express-session';
import methodOverride from 'method-override';
import path from 'path';
import { fileURLToPath } from 'url';
import passport from './utils/passport.js';
import handlebarsHelpers from './utils/handlebars.helpers.js';

import { startAuctionEndNotifier } from './scripts/auctionEndNotifier.js';

import homeRouter from './routes/home.route.js';
import productRouter from './routes/product.route.js';
import accountRouter from './routes/account.route.js';
import adminCategoryRouter from './routes/admin/category.route.js';
import adminUserRouter from './routes/admin/user.route.js';
import adminAccountRouter from './routes/admin/account.route.js';
import adminProductRouter from './routes/admin/product.route.js';
import adminSystemRouter from './routes/admin/system.route.js';
import sellerRouter from './routes/seller.route.js';

import { isAuthenticated, isSeller, isAdmin } from './middlewares/auth.mdw.js';
import localsUserMiddleware from './middlewares/locals-user.mdw.js';
import localsCategoriesMiddleware from './middlewares/locals-categories.mdw.js';
import * as categoryModel from './models/category.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3005;

app.use('/static', express.static('public'));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.use(methodOverride('_method'));
app.use(session({
  secret: 'x8w3v9p2q1r7s6t5u4z0a8b7c6d5e4f3g2h1j9k8l7m6n5o4p3q2r1s0t9u8v7w6x5y4z3',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

app.engine('handlebars', engine({
  defaultLayout: 'main',
  helpers: handlebarsHelpers,
  partialsDir: [
    path.join(__dirname, 'views/partials'), 
    path.join(__dirname, 'views/vwAccount') 
  ]
}));
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(localsUserMiddleware);
app.use(localsCategoriesMiddleware);

app.use('/admin', isAdmin);
app.use('/admin', function (req, res, next) {
    res.locals.isAdminMode = true; 
    next();
});

app.use('/admin/account', adminAccountRouter);
app.use('/admin/users', adminUserRouter);
app.use('/admin/categories', adminCategoryRouter);
app.use('/admin/products', adminProductRouter);
app.use('/admin/system', adminSystemRouter);
app.use('/seller', isAuthenticated, isSeller, sellerRouter);

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

app.use('/', homeRouter);
app.use('/products', productRouter);
app.use('/account', accountRouter);

app.listen(PORT, function () {
  console.log(`Server is running on http://localhost:${PORT}`);
  
  startAuctionEndNotifier(30);
});
