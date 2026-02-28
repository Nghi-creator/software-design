import 'dotenv/config';
import express from 'express';
import { startAuctionEndNotifier } from './scripts/auctionEndNotifier.js';

import setupSession from './startup/session.js';
import setupViews from './startup/view-engine.js';
import setupMiddlewares from './startup/middlewares.js';
import registerRoutes from './startup/routes.js';

const app = express();
const PORT = process.env.PORT || 3005;

// Startup Modules
setupSession(app);
setupViews(app);
setupMiddlewares(app);
registerRoutes(app);

app.listen(PORT, function () {
  console.log(`Server is running on http://localhost:${PORT}`);

  // Background Workers
  startAuctionEndNotifier(30);
});
