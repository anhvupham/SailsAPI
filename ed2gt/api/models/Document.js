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
            limitword: '',
            createdBy: {
                name : '',
                email : ''
            },
            participants: [
                {
                    name : '',
                    email : '',
                    joining: false,
                    joindate : '',
                    order : 0
                }
            ],
            currentTurn: {
                email : '',
                name : '',
                expire : ''
            },
            logs: [
                {
                    name : '',
                    id: '',
                    email : '',
                    date: '',
                    content: '',
                    modified : ''
                }
            ]
        }
        utils.normalize(obj, schema, true)
        return schema
    }
};
