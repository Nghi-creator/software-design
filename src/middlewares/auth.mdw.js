export function isAuthenticated(req, res, next) {
    if (req.session.isAuthenticated) {
        next();
    } else {
        req.session.returnUrl = req.originalUrl;
        res.redirect('/account/signin');
    }
}
export function requireRole(roleTarget) {
    return (req, res, next) => {
        if (req.session.authUser && req.session.authUser.role === roleTarget) {
            next();
        } else {
            res.render('403');
        }
    };
}

export const isSeller = requireRole('seller');
export const isAdmin = requireRole('admin');