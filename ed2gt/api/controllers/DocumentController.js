/**
 * DocumentController
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
    create: function(req, res) {
        var item = req.body
        if (item)
        {
            item = Document.convert(item)
            var email = req.session.user.email
            var name = req.session.user.name
            item.createdBy.email = email
            item.createdBy.name = name
            item.participants.push({
                email: email,
                name: name,
                joining: true,
                joindate: new Date().format(res.i18n('MM/dd/yyyy HH:MM:ss'))
            })
            item.currentTurn = 0
            item.currentTurnExpired = new Date().addHours(sails.config.conf.maxHourDuration).format(res.i18n('MM/dd/yyyy HH:MM:ss'))
            item.logs.push({
                name : name,
                email : email,
                date : new Date().format(res.i18n('MM/dd/yyyy HH:MM:ss')),
                content : item.content
            })
            Document.create(item).done(function(err, newitem) {
                if (err)
                {
                    var opts = {
                        message: res.i18n('Opps, something wrong with DB'),
                        code: 503,
                        err: {
                            message: err,
                            root: 'document.create'
                        }
                    }
                    utils.response(res, opts)
                }
                else
                {
                    var opts = {
                        message: 'ok',
                        code: 200,
                        result: newitem
                    }
                    utils.response(res, opts)
                }
            })
        }
    }
};
