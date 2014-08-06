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
            createdBy: {
                email : '',
                name : ''
            },
            participants: [
                {
                    name: '',
                    email : '',
                    joining: false,
                    joindate : ''
                }
            ],
            currentTurn: '',
            currentTurnExpired: '',
            logs: [
                {
                    name: '',
                    email : '',
                    date: '',
                    content: ''
                }
            ]
        }
        utils.normalize(obj, schema, true)
        return schema
    }
};
