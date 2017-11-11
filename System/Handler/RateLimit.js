var Misc = require('./Misc');

function RateLimit(Count, ExpireTime)
{
    return function(req, res, next)
    {
        var IP = req.connection.remoteAddress;
        var URL = req.originalUrl.substr(1);
        var Time = Misc.Time;

        DB.collection("ratelimit").findOneAndUpdate({ IP: IP, URL: URL }, { $inc: { Count: 1 } }, { projection: { _id: 0, Count: 1, Time: 1 } }, function(error, result)
        {
            if (error)
            {
                Misc.Log(error);
                return res.json({ Message: -1 });
            }

            if (result.value === null)
            {
                DB.collection("ratelimit").insertOne({ IP: IP, URL: URL, Count: 1, Time: Time + ExpireTime });
                next();
                return;
            }

            if (result.value.Time < Time)
            {
                DB.collection("ratelimit").updateOne({ _id: new MongoID(result.value._id) }, { $set: { Time: Time + ExpireTime, Count: 0 } });
                next();
                return;
            }

            if (result.value.Count > Count)
            {
                Misc.Log(IP + " Exceed Request " + URL);
                return res.json({ Message: -2 });
            }

            next();
        });
    }
}

module.exports = RateLimit;
