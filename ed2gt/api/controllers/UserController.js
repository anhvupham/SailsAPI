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
        var captcha = req.body.captcha
        if (!captcha)
        {
            var opts = {
                message: res.i18n('Please input captcha'),
                code: 200
            }
            utils.response(res, opts)
        }
        else
        {
            if (captcha !== req.session.captcha)
            {
                var opts = {
                    message: res.i18n('You input wrong captcha'),
                    code: 200
                }
                utils.response(res, opts)
            }
            else
            {
                var item = User.convert(req.body)
                User.find().where({email: item.email}).done(function(err, items) {
                    if (err)
                    {
                        var opts = {
                            message: res.i18n('Opps, something wrong with DB'),
                            code: 500,
                            err: {
                                message: err,
                                root: 'user.signup.findUser'
                            }
                        }
                        utils.response(res, opts)
                    }
                    else
                    {
                        if (items.length > 0)
                        {
                            var opts = {
                                message: res.i18n('Email already existed in the universe. Please type another email'),
                                code: 200
                            }
                            utils.response(res, opts)
                        }
                        else
                        {
                            utils.hash(item.passwd, function(err, hash) {
                                if (err)
                                {
                                    var opts = {
                                        message: res.i18n('Error when creating password'),
                                        code: 500,
                                        err: {
                                            message: err,
                                            root: 'user.signup.hashPassword'
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
                                                    root: 'user.signup.createUser'
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
                    }
                })
            }
        }
    },
    signin: function(req, res) {
        var email = utils.validateObject(req.body.email, '')
        var passwd = utils.validateObject(req.body.passwd, '')
        User.findOne({
            email: email,
            isActive: true
        }).done(function(err, item) {
            if (err)
            {
                var opts = {
                    message: res.i18n('Opps, something wrong with DB'),
                    code: 500,
                    err: {
                        message: err,
                        root: 'user.signin'
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
                                id: item.id,
                                isAdmin: item.isAdmin
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
    },
    generateCaptcha: function(req, res) {
        var captchagen = require('captchagen').create()
        var text = captchagen.text()
        captchagen.generate()
        var base64 = captchagen.buffer().toString('base64')
        req.session.captcha = text//set to session
        var opts = {
            message: 'ok',
            code: 200,
            result: base64
        }
        utils.response(res, opts)
    },
    changeName: function(req, res) {
        var name = utils.validateObject(req.body.name, '')
        User.update({email: req.session.user.email}, {name: name}).done(function(err, items) {
            if (err)
            {
                var opts = {
                    message: res.i18n('Opps, something wrong with DB'),
                    code: 500,
                    err: {
                        message: err,
                        root: 'user.changename'
                    }
                }
                utils.response(res, opts)
            }
            else
            {
                if (items.length <= 0)
                {
                    var opts = {
                        message: res.i18n('User is not existed'),
                        code: 200
                    }
                    utils.response(res, opts)
                }
                else
                {
                    var opts = {
                        message: 'ok',
                        code: 200
                    }
                    utils.response(res, opts)
                }
            }
        })
    },
    getNameByEmail: function(req, res) {
        var email = utils.validateObject(req.param('email'))
        User.findOne({email: email}).done(function(err, item) {
            if (err)
            {
                var opts = {
                    message: res.i18n('Opps, something wrong with DB'),
                    code: 500,
                    err: {
                        message: err,
                        root: 'user.getNameByEmail'
                    }
                }
                utils.response(res, opts)
            }
            else
            {
                res.setHeader('Content-Type', 'text/plain');
                res.end(item ? item.name : '', 'utf-8')
            }
        })
    },
    blockUser: function(req, res) {
        var email = utils.validateObject(req.param('email'))
        User.findOne({email: email}).done(function(err, item) {
            if (err)
            {
                var opts = {
                    message: res.i18n('Opps, something wrong with DB'),
                    code: 500,
                    err: {
                        message: err,
                        root: 'user.blockUserFind'
                    }
                }
                utils.response(res, opts)
            }
            else
            {
                if (item)
                {
                    item.isActive = false
                    item.save(function(err) {
                        if (err)
                        {
                            var opts = {
                                message: res.i18n('Opps, something wrong with DB'),
                                code: 500,
                                err: {
                                    message: err,
                                    root: 'user.blockUserSave'
                                }
                            }
                            utils.response(res, opts)
                        }
                        else
                        {
                            var opts = {
                                message: 'ok',
                                code: 200
                            }
                            utils.response(res, opts)
                        }
                    })
                }
                else
                {
                    var opts = {
                        message: res.i18n('Email is not existed'),
                        code: 200
                    }
                    utils.response(res, opts)
                }
            }
        })
    }
};
