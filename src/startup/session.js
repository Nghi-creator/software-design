import session from 'express-session';
import passport from '../utils/passport.js';

export default function (app) {
    app.use(session({
        secret: process.env.SESSION_SECRET || 'default-secret-for-dev-only',
        resave: false,
        saveUninitialized: false, // Changed to false for better practice (YAGNI/Security)
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    }));

    app.use(passport.initialize());
    app.use(passport.session());
}
