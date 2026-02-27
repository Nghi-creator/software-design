export default function localsUserMiddleware(req, res, next) {
  const isAuthenticated = req.session.isAuthenticated || false;
  const user = req.session.authUser || null;

  res.locals.isAuthenticated = isAuthenticated;
  res.locals.authUser = user;
  res.locals.isAdmin = user?.role === 'admin';
  res.locals.isSeller = user?.role === 'seller';

  next();
}
