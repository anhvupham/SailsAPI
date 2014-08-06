/**
 * User
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {
    schema: false,
    attributes: {
    },
    convert: function(obj) {
        var schema = {
            email: 'string',
            passwd: 'string',
            name: 'string',
            isActive: false,
            lastLogin: 'string',
            isAdmin: false
        }
        utils.normalize(obj, schema, true)
        return schema
    }
};
