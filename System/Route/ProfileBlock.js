const PostRouter = require('express').Router();
const RateLimit  = require('../Handler/RateLimit');
const Auth       = require('../Handler/Auth');
const Misc       = require('../Handler/Misc');

PostRouter.post('/ProfileBlock', Auth(), RateLimit(30, 60), async function(req, res)
{
    let Username = req.body.Username;

    if (Username === undefined || Username === '')
        return res.json({ Message: 1 });

    Username = Username.toLowerCase();

    const Account = await DB.collection("account").aggregate([ { $match: { Username: Username } }, { $group: { _id: "$_id", Count: { $sum: 1 } } } ]).toArray();

    if (Account[0] === undefined)
        return res.json({ Message: 2 });

    const Owner = res.locals.ID;

    if (Owner.equals(Account[0]._id))
        return res.json({ Message: 3 });

    DB.collection("block").updateOne({ Owner: Owner, Target: Account[0]._id }, { $set: { Owner: Owner, Target: Account[0]._id, Time: Misc.Time() } }, { upsert: true });

    res.json({ Message: 0 });
});

module.exports = PostRouter;
