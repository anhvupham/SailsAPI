module.exports = function(req, res, next) {
   req.locale=req.param('lang')//get lang param from url query string
   next();
};


