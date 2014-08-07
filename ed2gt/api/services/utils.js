var sanitizer = require('sanitizer');

exports.normalize = function(main, schema, requireSanitizer) {
    for (var k in schema) {
        if ((schema[k] instanceof Object) && main[k] && schema[k] != null) {
            if (schema[k] instanceof Array) {//if schema object is Array ?
                if ((main[k] instanceof Array)) {//if main object is also an Array ?
                    if (main[k].length <= 0) {//if main object array is empty then just set the schema array empty too
                        schema[k] = []
                    } else {
                        if (schema[k].length > 0) {//if we have a schema for item in Array ?
                            var arr = main[k]
                            var newarr = [];//define new empty array
                            for (var j in arr) {
                                var newitem = (j == 0 ? schema[k][0] : JSON.parse(JSON.stringify(schema[k][0])))//clone obj without reference, if the first obj then dont have to clone
                                utils.normalize(arr[j], newitem, requireSanitizer)
                                newarr.push(newitem)
                                if (j == arr.length - 1)
                                {
                                    schema[k] = newarr //put the schema array by the new array that have data
                                }
                            }
                        } else {
                            schema[k] = main[k]//if we have schema[k] is Array but no schema template insided, then just bring everything from main[k] in
                        }
                    }
                } else {
                    schema[k] = []//if schema[k] is array but main[k] is not array then mark schema[k] as EMPTY array
                }
            } else {
                utils.normalize(main[k], schema[k], requireSanitizer)
            }
        } else {
            if (main[k] == undefined) {
                //DO NOTHING
            } else {
                if ((typeof schema[k] == 'string') || schema[k] == null) {//if type of String or Null then can accept any type of data
                    transform(requireSanitizer)
                } else {
                    if ((typeof schema[k]) == (typeof main[k]))// if NOT then both have to be same type
                        transform(false)
                    else {
                        if (main[k] != '' && main[k] != null) {
                            switch (typeof schema[k]) {//if not, then last chance is convert it
                                case 'number':
                                    schema[k] = utils.parseFloat(main[k])
                                    break
                                case 'boolean':
                                    schema[k] = (main[k] == 'true' ? true : false)
                                    break
                            }
                        }
                    }
                }
                function transform(requireSanitizer) {
                    if (requireSanitizer == true) {
                        schema[k] = utils.changehtml(sanitizer.sanitize(main[k]));
                    } else {
                        schema[k] = main[k];
                    }
                }
            }
        }
    }
};

exports.response = function(res, params) {
    var opts = {
        message: params.message,
        result: params.result
    }
    if (sails.config.local.environment === 'development')
    {
        opts.err = params.err
    }
    res.json(opts, params.code)
    if (params.code !== 200)//log the error into DB
    {
        var log = {
            message: params.err.message,
            root: params.err.root,
            date: new Date().format(res.i18n('MM/dd/yyyy HH:MM:ss'))
        }
        Logs.create(log).done(function(err, item) {
            if (err)
                console.log(log)
        })
    }
}

exports.changehtml = function(str) {
    str = str.replace('&amp;', '&');
    return str;
}

exports.hash = function(rawtext, callback) {
    var bcrypt = require('bcrypt');
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(rawtext, salt, callback);
    });
}

exports.validateObject = function(obj) {
    return obj !== undefined ? sanitizer.sanitize(obj) : null;
}

exports.validateObject = function(obj, defaultValue) {
    if (obj) {
        var result = sanitizer.sanitize(obj)
        switch (typeof defaultValue) {//if not, then last chance is convert it
            case 'number':
                return Utils.parseFloat(result)
                break
            case 'boolean':
                return (result == 'true' ? true : false)
                break
            case 'string':
                return result
                break
            default :
                return result
        }
    } else {
        if (defaultValue != undefined)
            return defaultValue
        else
        if (obj === undefined)
            return ''
        else
            return obj
    }
}

exports.duration = function(params) {
    var participants = params.participants.length
    var maxHourDuration = params.participants.maxHourDuration ? params.participants.maxHourDuration : sails.config.conf.maxHourDuration
    return parseInt(maxHourDuration / participants)
}

exports.now = function(res, hours) {
    if (!hours)
        return new Date().format(res.i18n('mm/dd/yyyy HH:MM:ss'))
    else
        return new Date().addHours(hours).format(res.i18n('mm/dd/yyyy HH:MM:ss'))
}

exports.sendEmail = function(params, callback)
{
    var to = ''
    if (params.sendto.constructor === Array)
    {
        for (var i = 0; i < params.sendto.length; i++)
        {
            to += (params.sendto[i] + ',')
        }
    }
    else
    {
        to = params.sendto
    }

    var nodemailer = require('nodemailer')
    var smtpTransport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: sails.config.smtp.smtpusername,
            pass: sails.config.smtp.smtppass
        }
    });

    var mail = {
        from: require('util').format('%s <%s>', sails.config.smtp.emailFrom, sails.config.smtp.smtpusername),
        to: to,
        subject: params.subject,
        text: params.text,
        html: params.html,
        attachments: params.attachments
    }

    smtpTransport.sendMail(mail, function(err, response) {
        if (err)
        {
            callback(err)
        }
        else
        {
            callback('')
        }

        smtpTransport.close();
    });
}
