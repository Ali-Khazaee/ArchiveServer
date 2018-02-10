const PostRouter = require('express').Router();
const RateLimit  = require('../Handler/RateLimit');
const Auth       = require('../Handler/Auth');
const Misc       = require('../Handler/Misc');

PostRouter.post('/PostReport', Auth(), RateLimit(30, 60), async function(req, res)
{
    const PostID = MongoID(req.body.PostID);

    if (PostID === undefined || PostID === '')
        return res.json({ Message: 1 });

    const Reason = req.body.Reason;

    if (Reason === undefined || Reason === '')
        return res.json({ Message: 2 });

    const Post = await DB.collection("post").aggregate([ { $match: { _id: PostID } }, { $group: { _id: null, Count: { $sum: 1 } } } ]).toArray();

    if (Post[0].Count === undefined || Post[0].Count === null)
        return res.json({ Message: 3 });

    DB.collection("post_report").insertOne({ Owner: res.locals.ID, Post: PostID, Time: Misc.Time(), Reason: Reason });

    res.json({ Message: 0 });
});

module.exports = PostRouter;
