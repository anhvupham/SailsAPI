module.exports = {
    schema: false,
    attributes: {
    },
    convert: function(obj) {
        var schema = {
            message: 'string',
            root: 'string',
            date: 'string'
        }
        utils.normalize(obj, schema, true)
        return schema
    }
};


