var DB = require('./DataBase');

function RateLimit(Count, Time)
{
    return function(req, res, next)
    {
        var IP = req.connection.remoteAddress;
        var URL = req.originalUrl.substr(1);




        console.log(IP + " -- " + URL);

        next();
    }
}

module.exports = RateLimit;
