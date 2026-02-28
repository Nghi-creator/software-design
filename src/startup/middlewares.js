import express from 'express';
import methodOverride from 'method-override';
import localsUserMiddleware from '../middlewares/locals-user.mdw.js';
import localsCategoriesMiddleware from '../middlewares/locals-categories.mdw.js';

export default function (app) {
    app.use('/static', express.static('public'));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    app.use(express.json({ limit: '50mb' }));
    app.use(methodOverride('_method'));

    // Application custom middlewares
    app.use(localsUserMiddleware);
    app.use(localsCategoriesMiddleware);
}
