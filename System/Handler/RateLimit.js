var File = require('fs');

function RateLimit(Count, Time)
{
    return function(req, res, next)
    {
        var IP = req.connection.remoteAddress;
        var URL = req.originalUrl.substr(1);


        /*File.readFile(IP, function(Error, data)
        {
            if (Error)
            {
                File.open(IP, 'w', function (err, file)
                {
                    if (err)
                        throw err;

                    file.write("salam");

                    console.log('Saved!');
                });
            }
        });*/

        console.log(IP + " -- " + URL);

        next();
    }
}

module.exports = RateLimit;
