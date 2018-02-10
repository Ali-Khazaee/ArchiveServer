const PostRouter = require('express').Router();
const RateLimit  = require('../Handler/RateLimit');
const Auth       = require('../Handler/Auth');
const Misc       = require('../Handler/Misc');

PostRouter.post('/PostBookmark', Auth(), RateLimit(30, 60), async function(req, res)
{
    const PostID = MongoID(req.body.PostID);

    if (PostID === undefined || PostID === '')
        return res.json({ Message: 1 });

    const Post = await DB.collection("post").aggregate([ { $match: { _id: PostID } }, { $group: { _id: null, Count: { $sum: 1 } } } ]).toArray();

    if (Post[0].Count === undefined || Post[0].Count === null)
        return res.json({ Message: 2 });

    const Owner = res.locals.ID;
    const Bookmark = await DB.collection("post_bookmark").aggregate([ { $match: { $and: [ { _id: PostID }, { Owner: Owner } ] } }, { $group: { _id: null, Count: { $sum: 1 } } } ]).toArray();

    if (Bookmark[0].Count === undefined || Bookmark[0].Count === null)
    {
        DB.collection("post_bookmark").insertOne({ Owner: Owner, Post: PostID, Time: Misc.Time() });

        // TODO Add Notification
    }
    else
    {
        DB.collection("post_bookmark").deleteOne({ $and: [ { Owner: Owner }, { Post: PostID } ] });

        // TODO Add Notification
    }

    res.json({ Message: 0 });
});

module.exports = PostRouter;
