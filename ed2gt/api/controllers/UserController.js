/**
 * UserController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {
    signup: function(req, res) {
        var item = req.body
        if (item)
        {
            item = User.convert(item)
            utils.hash(item.passwd, function(err, hash) {
                if (err)
                {
                    var opts = {
                        message: res.i18n('Error when creating password'),
                        code: 500,
                        err: {
                            message: err,
                            root: 'user.signup'
                        }
                    }
                    utils.response(res, opts)
                }
                else
                {
                    item.passwd = hash
                    User.create(item).done(function(err, newitem) {
                        if (err)
                        {
                            var opts = {
                                message: res.i18n('Opps, something wrong with DB'),
                                code: 500,
                                err: {
                                    message: err,
                                    root: 'user.signup'
                                }
                            }
                            utils.response(res, opts)
                        }
                        else
                        {
                            var opts = {
                                message: 'ok',
                                code: 200,
                                result: item
                            }
                            utils.response(res, opts)
                        }
                    })
                }
            })
        }
    },
    signin: function(req, res) {
        var email = utils.validateObject(req.body.email, '')
        var passwd = utils.validateObject(req.body.passwd, '')
        User.findOne({
            email: email,
            isActive : true
        }).done(function(err, item) {
            if (err)
            {
                var opts = {
                    message: res.i18n('Opps, something wrong with DB'),
                    code: 500,
                    err: {
                        message: err,
                        root: 'user.login'
                    }
                }
                utils.response(res, opts)
            }
            else
            {
                if (!item)
                {
                    var opts = {
                        message: res.i18n('We can\'t find you in the universe. Are you sure already signup ?'),
                        code: 200
                    }
                    utils.response(res, opts)
                }
                else
                {
                    var bcrypt = require('bcrypt');
                    bcrypt.compare(passwd, item.passwd, function(err, same) {

                        if (!same)
                        {
                            var opts = {
                                message: res.i18n('Incorrect password'),
                                code: 200
                            }
                            utils.response(res, opts)
                        }
                        else
                        {
                            req.session.user = {
                                name: item.name,
                                email: item.email,
                                id: item.id
                            }
                            var opts = {
                                message: 'ok',
                                code: 200
                            }
                            utils.response(res, opts)
                            item.lastLogin = new Date()
                            item.save(function() {
                                //DO NOTHING
                            })//update last login
                        }
                    })
                }
            }
        })
    }
};
