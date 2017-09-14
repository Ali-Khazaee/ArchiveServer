var Misc = require('./Misc');

function RateLimit(Count, ExpireTime)
{
    return function(req, res, next)
    {
        var IP = req.connection.remoteAddress;
        var URL = req.originalUrl.substr(1);
        var Time = Math.floor(Date.now() / 1000);

        DB.collection("ratelimit").findOneAndUpdate({ IP: IP, URL: URL }, { $inc: { Count: 1 } }, function(error, result)
        {
            if (error)
            {
                Misc.FileLog(error);
                return res.json({ Message: -1 });
            }

            if (result === null || result.value === null)
            {
                DB.collection("ratelimit").insertOne({ IP: IP, URL: URL, Count: 1, Time: Time + ExpireTime });
                next();
                return;
            }

            if (result.value.Time < Time)
            {
                DB.collection("ratelimit").updateOne({ _id: new MongoID(result.value._id) }, { $set: { Time: Time + ExpireTime, Count: 1 } });
                next();
                return;
            }

            if (result.value.Count > Count)
            {
                Misc.FileLog(IP + " Exceed Request " + URL);
                return res.json({ Message: -2 });
            }

            next();
        });
    }
}

module.exports = RateLimit;
