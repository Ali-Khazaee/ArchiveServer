const PostRouter = require('express').Router();
const RateLimit  = require('../Handler/RateLimit');
const Auth       = require('../Handler/Auth');
const Misc       = require('../Handler/Misc');
const Post       = require('../Model/Post');

PostRouter.post('/PostListInbox', Auth(), RateLimit(10, 60), async function(req, res)
{
    res.json({ Message: 0, Result: await Post.GetPrivate("599e4362be387c01ce2b3576") })

    /*const ID = new MongoID(res.locals.ID);

    new Promise((resolve) =>
    {
        DB.collection("follow2").find({ Following: ID }, { _id: 0, Follower: 1 }).toArray(function(error, result)
        {
            if (error)
            {
                Misc.Log("[DB]: " + error);
                return res.json({ Message: -1 });
            }

            let PeopleList = [ID];

            for (const item of result) { PeopleList.push(item.Follower); }

            resolve(PeopleList);
        });
    })
    .then((PeopleList) =>
    {
        let Count = 0;
        let PostList = [];
        let Size = PeopleList.length;

        for (const item of PeopleList)
        {
            DB.collection("post2").find({ Owner: item }, { _id: 1, Time: 1 }).toArray(function(error, result)
            {
                if (error)
                {
                    Misc.Log("[DB]: " + error);
                    return res.json({ Message: -1 });
                }

                for (const item2 of result) { PostList.push( { ID: item2._id, Time: item2.Time } ); }

                if (++Count >= Size)
                    resolve(PostList);
            });
        }
    })
    .then((PostList) =>
    {
        // Sort By Value
        PostList.sort(function(a, b)
        {
            if (a["Time"] > b["Time"])
                return -1;
            else if (a["Time"] < b["Time"])
                return 1;

            return 0;
        });

        let Count = 0;
        let Count2 = 0;
        let Result = [];
        let Skip = req.body.Skip;

        if (typeof Skip === 'undefined' || Skip === '')
            Skip = 0;

        for (let I = Skip; I < PostList.length; I++)
        {
            if (++Count > 7)
                break;

            DB.collection("post2").findOne({ _id: PostList[I].ID }, { _id : 0, Time: 0 }, function(error2, result2)
            {
                if (error2)
                {
                    Misc.Log("[DB]: " + error2);
                    return res.json({ Message: -1 });
                }

                if (result !== null)
                {

                }

                if (++Count2 > 7)
                    resolve(Result);
            });
        }
    })
    .then((Result) =>
    {
        res.json({ Message: 0, Result: Result })
    });*/
});

module.exports = PostRouter;
