const PostRouter = require('express').Router();
const RateLimit  = require('../Handler/RateLimit');
const Auth       = require('../Handler/Auth');
const Misc       = require('../Handler/Misc');

PostRouter.post('/PostLike', Auth(), RateLimit(30, 60), function(req, res)
{
    const Post = MongoID(req.body.PostID);

    if (Post === undefined || Post === '')
        return res.json({ Message: 1 });

    DB.collection("post").findOne({ _id: Post }, { Owner: 1 }, function(error, result)
    {
        if (error)
        {
            Misc.Log("[PostLike]: " + error);
            return res.json({ Message: -1 });
        }

        if (result === null)
            return res.json({ Message: 2 });

        const Owner = res.locals.ID;

        DB.collection("post_like").findOne({ $and: [ { Post: Post }, { Owner: Owner } ] }, function(error2, result2)
        {
            if (error2)
            {
                Misc.Log("[PostLike-2]: " + error2);
                return res.json({ Message: -1 });
            }

            if (result2 === null)
            {
                DB.collection("post_like").insertOne({ Owner: Owner, Post : Post, Time: Misc.Time() }, function(error3)
                {
                    if (error3)
                    {
                        Misc.Log("[PostLike-3]: " + error3);
                        return res.json({ Message: -1 });
                    }

                    // TODO Add Notification

                    res.json({ Message: 0 });
                });
            }
            else
            {
                DB.collection("post_like").deleteOne({ $and: [ { Post: Post }, { Owner: Owner } ] }, function(error3)
                {
                    if (error3)
                    {
                        Misc.Log("[PostLike-4]: " + error3);
                        return res.json({ Message: -1 });
                    }

                    // TODO Add Notification

                    res.json({ Message: 0 });
                });
            }
        });
    });
});

module.exports = PostRouter;
