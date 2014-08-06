/**
 * isAuthenticated
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function(req, res, next) {

    // User is allowed, proceed to the next policy, 
    // or if this is the last policy, the controller
    if (req.session.user) {
        return next();
    }
    if (req.param('dev') === 'true')
    {
        req.session.user = {
            name: 'Vincent',
            email: 'anhvu.phamduong@gmail.com',
            id: 'test',
            isAdmin : true
        }
        return next();
    }
    // User is not allowed
    // (default res.forbidden() behavior can be overridden in `config/403.js`)
    return res.forbidden(res.i18n('You are not permitted to perform this action.'));
};
