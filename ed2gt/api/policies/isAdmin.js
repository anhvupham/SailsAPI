module.exports = function(req, res, next) {
    if (req.session.user) {
        if (req.session.user.isAdmin) {
            return next()
        }
    }
    return res.forbidden(res.i18n('You are not administrator. Don\'t play with me.'));
}


