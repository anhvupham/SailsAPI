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
                joindate: utils.now(res),
                order: 0
            })
            item.currentTurn.name = req.session.user.name
            item.currentTurn.email = req.session.user.email
            item.currentTurn.expire = utils.now(res, utils.duration({participants: item.participants}))
            item.logs.push({
                id: new Date().getTime(), //id is the now.milliseconds
                name: name,
                email: email,
                date: utils.now(res),
                content: item.content
            })
            Document.create(item).done(function(err, newitem) {
                if (err)
                {
                    var opts = {
                        message: res.i18n('Opps, something wrong with DB'),
                        code: 503,
                        err: {
                            message: err,
                            root: 'document.create.createDocument'
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
    },
    getById: function(req, res) {
        var id = utils.validateObject(req.param('id'), '')
        Document.findOne(id).done(function(err, item) {
            if (err)
            {
                var opts = {
                    message: res.i18n('Opps, something wrong with DB'),
                    code: 503,
                    err: {
                        message: err,
                        root: 'document.getById.findOne'
                    }
                }
                utils.response(res, opts)
            }
            else
            {
                if (!item)
                {
                    var opts = {
                        message: res.i18n('Document is not existed'),
                        code: 200
                    }
                    utils.response(res, opts)
                }
                else
                {
                    var existed = item.participants.filter(function(r) {
                        return r.email === req.session.user.email
                    })[0]
                    if (existed)
                    {
                        var opts = {
                            message: 'ok',
                            code: 200,
                            result: item
                        }
                        utils.response(res, opts)
                    }
                    else
                    {
                        var opts = {
                            message: res.i18n('Sorry, seems as you are not allowed in this party'),
                            code: 200
                        }
                        utils.response(res, opts)
                    }
                }
            }
        })
    },
    getDocuments: function(req, res) {
        var email = req.session.user.email
        Document.find().where({
            'participants': {
                $elemMatch: {
                    email: email
                }
            }
        }).done(function(err, items) {
            if (err)
            {
                var opts = {
                    message: res.i18n('Opps, something wrong with DB'),
                    code: 503,
                    err: {
                        message: err,
                        root: 'document.getById.findOne'
                    }
                }
                utils.response(res, opts)
            }
            else
            {
                var opts = {
                    message: 'ok',
                    code: 200,
                    result: []
                }
                items.forEach(function(item) {
                    var title = item.title
                    var joined = item.participants.filter(function(e) {
                        return e.email === email
                    })[0].joining
                    var currentName = item.currentTurn.name
                    opts.result.push({
                        title: title,
                        join: joined ? res.i18n('Currently joined') : res.i18n('Not joined yet'),
                        turn: require('util').format(res.i18n('%s is in turn'), currentName === req.session.user.name ? 'You' : currentName),
                        joinkey: joined
                    })
                })
                utils.response(res, opts)
            }
        })
    },
    addLog: function(req, res) {
        var content = utils.validateObject(req.body.content, '')
        var id = utils.validateObject(req.body.id, '')
        Document.findOne(id).done(function(err, item) {
            if (err)
            {
                var opts = {
                    message: res.i18n('Opps, something wrong with DB'),
                    code: 503,
                    err: {
                        message: err,
                        root: 'document.addLog.findOne'
                    }
                }
                utils.response(res, opts)
            }
            else
            {
                if (!item)
                {
                    var opts = {
                        message: res.i18n('Document is not existed.'),
                        code: 200
                    }
                    utils.response(res, opts)
                }
                else
                {
                    if (req.session.user.email !== item.currentTurn.email)
                    {
                        var opts = {
                            message: res.i18n('You are not the currently in turn, please wait for your turn.'),
                            code: 200
                        }
                        utils.response(res, opts)
                    }
                    else
                    {
                        item.logs.push({
                            name: req.session.user.name,
                            id: new Date().getTime(),
                            email: req.session.user.email,
                            date: utils.now(res),
                            content: content.trim()
                        })
                        var participants = item.participants
                        var currentTurnItem = participants.filter(function(e) {//get current turn item by email and joining status
                            return (e.email === item.currentTurn.email && e.joining === true)
                        })[0]
                        var maxOrderItem = participants.sort(function(a, b) {//get max order item
                            return b.order - a.order
                        })[0]
                        var maxOrder = maxOrderItem ? maxOrderItem.order : 0//get max order number
                        if (!currentTurnItem)
                        {
                            var opts = {
                                message: res.i18n('You are not in the participants list'),
                                code: 200
                            }
                            utils.response(res, opts)

                            item.currentTurn.name = item.createdBy.name//reset current turn name
                            item.currentTurn.email = item.createdBy.email//reset current turn email
                            item.currentTurn.expire = utils.now(res, utils.duration({participants: item.participants}))//reset current turn expired
                            item.save(function(err) {
                                if (err) {
                                    var opts = {
                                        message: res.i18n('Opps, something wrong with DB'),
                                        code: 503,
                                        err: {
                                            message: err,
                                            root: 'document.addLog.reset'
                                        }
                                    }
                                    utils.response(res, opts)
                                }
                            })
                        }
                        else
                        {
                            function recursive(order, callback)//recursive function to get the correct next turn email
                            {
                                if (order <= maxOrder)
                                {
                                    var nextTurn = participants.filter(function(e) {
                                        return e.order === order
                                    })[0]
                                    if (nextTurn)
                                    {
                                        callback(nextTurn)
                                    }
                                    else
                                    {
                                        recursive(order + 1, callback)
                                    }
                                }
                                else
                                {
                                    callback(item.createdBy.email)//if order is more than max then turn back to created By user
                                }
                            }
                            recursive(currentTurnItem.order + 1, callback)//get the next turn email

                            function callback(item)//update the document
                            {
                                item.content = item.content + ' ' + content.trim()
                                item.currentTurn.name = item.name
                                item.currentTurn.email = item.email
                                item.currentTurn.expire = utils.now(res, utils.duration({participants: item.participants}))
                                item.save(function(err) {
                                    if (err)
                                    {
                                        var opts = {
                                            message: res.i18n('Opps, something wrong with DB'),
                                            code: 503,
                                            err: {
                                                message: err,
                                                root: 'document.addLog.save'
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

                        }
                    }
                }
            }
        })
    },
    join: function(req, res) {
        var id = utils.validateObject(req.param('id'), '')
        Document.findOne(id).done(function(err, item) {
            if (err)
            {
                var opts = {
                    message: res.i18n('Opps, something wrong with DB'),
                    code: 503,
                    err: {
                        message: err,
                        root: 'document.join.findOne'
                    }
                }
                utils.response(res, opts)
            }
            else
            {
                if (!item)
                {
                    var opts = {
                        message: res.i18n('Document is not existed.'),
                        code: 200
                    }
                    utils.response(res, opts)
                }
                else
                {
                    var existed = item.participants.filter(function(a) {
                        return a.email === req.session.user.email
                    })[0]
                    if (existed)
                    {
                        if (existed.joining === false)
                        {
                            existed.name = req.session.user.name
                            existed.joining = true
                            existed.joindate = utils.now(res)

                            item.save(function(err) {
                                if (err)
                                {
                                    var opts = {
                                        message: res.i18n('Opps, something wrong with DB'),
                                        code: 503,
                                        err: {
                                            message: err,
                                            root: 'document.join.save'
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
                        else
                        {
                            var opts = {
                                message: 'ok',
                                code: 200,
                                result: item
                            }
                            utils.response(res, opts)
                        }
                    }
                    else
                    {
                        var opts = {
                            message: res.i18n('Sorry, you are not seems to be existed in the invitation list.'),
                            code: 200
                        }
                        utils.response(res, opts)
                    }
                }
            }
        })
    },
    editLog: function(req, res) {
        var id = utils.validateObject(req.body.id, '')
        var logid = utils.validateObject(req.body.logid, '')
        var content = utils.validateObject(req.body.content, '')
        Document.findOne(id).done(function(err, item) {
            if (err)
            {
                var opts = {
                    message: res.i18n('Opps, something wrong with DB'),
                    code: 503,
                    err: {
                        message: err,
                        root: 'document.join.findOne'
                    }
                }
                utils.response(res, opts)
            }
            else
            {
                if (!item)
                {
                    var opts = {
                        message: res.i18n('Document is not existed.'),
                        code: 200
                    }
                    utils.response(res, opts)
                }
                else
                {
                    var logItem = item.logs.filter(function(e) {
                        return e.id === logid
                    })[0]
                    if (!logItem)
                    {
                        var opts = {
                            message: res.i18n('Log item is not existed.'),
                            code: 200
                        }
                        utils.response(res, opts)
                    }
                    else
                    {
                        logItem.content = content
                        logItem.modified = utils.now(res)
                        item.save(function(err) {
                            if (err)
                            {
                                var opts = {
                                    message: res.i18n('Opps, something wrong with DB'),
                                    code: 503,
                                    err: {
                                        message: err,
                                        root: 'document.editLog.save'
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
                }
            }
        })
    },
    share: function(req, res) {
        var sendto = req.body.sendto
        var message = utils.validateObject(req.body.message, '')
        var id = utils.validateObject(req.body.id, '')

        Document.findOne(id).done(function(err, item) {
            if (err)
            {
                var opts = {
                    message: res.i18n('Opps, something wrong with DB'),
                    code: 503,
                    err: {
                        message: err,
                        root: 'document.share.findOne'
                    }
                }
                utils.response(res, opts)
            }
            else
            {
                if (!item)
                {
                    var opts = {
                        message: res.i18n('Document is not existed'),
                        code: 200
                    }
                    utils.response(res, opts)
                }
                else
                {
                    ////////////////////////////////SEND EMAIL//////////////////////////////
                    function sendEmail(newSendTo)
                    {
                        if (newSendTo.length > 0)
                        {
                            var link = require('util').format("<a href='%s%s'>%s</a>", sails.config.conf.link, item.id, item.title)
                            message += require('util').format(res.i18n('<br/><br/> %s'), link)

                            var opts = {
                                sendto: newSendTo,
                                subject: require('util').format(res.i18n('%s invite you to create with him.'), req.session.user.name),
                                html: message
                            }
                            utils.sendEmail(opts, function(err) {//send email
                                if (err)
                                {
                                    var opts = {
                                        message: res.i18n('Opps, something wrong with send email function'),
                                        code: 503,
                                        err: {
                                            message: err,
                                            root: 'document.share.sendemail'
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
                                message: res.i18n('Your friends already received the invitation this document.'),
                                code: 200
                            }
                            utils.response(res, opts)
                        }
                    }
                    //////////////////////////////////ADD PARTICIPANTS///////////////////////////////////////
                    function filterSendto(arr, callback)
                    {
                        var newSendTo = []
                        for (var i = 0; i < arr.length; i++)
                        {
                            if (!item.participants.filter(function(a) {
                                return a.email === arr[i]
                            })[0])//if not existed in the participants 
                            {
                                newSendTo.push(arr[i])//add to new arr
                                addToParticipants(arr[i])//add to participants
                            }
                            if (item.participants.filter(function(a) {
                                return a.email === arr[i] && a.joining === false
                            })[0])//if existed but not joined yet
                            {
                                newSendTo.push(arr[i])//add to new arr
                            }
                            if (i === arr.length - 1)
                            {
                                callback(newSendTo)//callback to send email
                            }
                        }
                    }
                    if (sendto.constructor !== Array)//if send to single email
                    {
                        if (!item.participants.filter(function(a) {
                            return a.email === sendto
                        })[0])//if not existed in the participants 
                        {
                            addToParticipants(sendto)//add to participants
                            sendEmail(sendto)//send email
                        }
                        else//if existed in the participants
                        {
                            var opts = {
                                message: res.i18n('Your friend already joined this document.'),
                                code: 200
                            }
                            utils.response(res, opts)
                        }
                    }
                    else//if send to multiple email
                    {
                        filterSendto(sendto, sendEmail)
                    }
                    function addToParticipants(email)
                    {
                        var maxOrderItem = item.participants.sort(function(a, b) {//get max order item
                            return b.order - a.order
                        })[0]
                        item.participants.push({//push to participants array
                            name: '',
                            email: email,
                            joining: false,
                            joindate: '',
                            order: maxOrderItem ? maxOrderItem.order + 1 : 0
                        })
                        item.save(function(err) {//save
                            //DO NOTHING
                        })
                    }
                }
            }
        })

        User.findOne({email: req.session.user.email}).done(function(err, item) {//save email sendto to user profile
            if (item)
            {
                if (sendto.constructor === Array)
                {
                    sendto.forEach(function(e) {
                        if (item.contacts.indexOf(e) < 0)
                        {
                            item.contacts.push(e)
                        }
                    })
                }
                else
                {
                    if (item.contacts.indexOf(sendto) < 0)
                    {
                        item.contacts.push(sendto)
                    }
                }
                item.save(function(err) {
                    //DO NOTHING
                })
            }
        })
    }
};
