/**
 * Document
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {
    schema: false,
    attributes: {},
    convert: function(obj) {
        var schema = {
            title: '',
            content: '',
            createdBy: '',
            participants: [
                {
                    name: '',
                    joined: false
                }
            ],
            currentturn: '',
            nextTurnOn: '',
            logs: [
                {
                    name: '',
                    date: '',
                    content: ''
                }
            ]
        }
        utils.normalize(obj, schema, true)
        return schema
    }
};
