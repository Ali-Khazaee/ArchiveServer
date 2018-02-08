const PostRouter = require('express').Router();
const RateLimit  = require('../Handler/RateLimit');
const Auth       = require('../Handler/Auth');
const Misc       = require('../Handler/Misc');

PostRouter.post('/PostVote', Auth(), RateLimit(30, 60), async function(req, res)
{
    const Vote = req.body.Vote;

    if (Vote === undefined || (Vote > 5 && Vote < 1))
        return res.json({ Message: 1 });

    const Post = MongoID(req.body.Post);

    if (Post === undefined || Post === '')
        return res.json({ Message: 2 });

    const Owner = res.locals.ID;

    await DB.collection("post").findOne({ _id: Post }, { Data: 1 }, async function(error, result)
    {
        if (error)
        {
            Misc.Log("[PostVote]: " + error);
            return res.json({ Message: -1 });
        }

        if (result === null)
            return res.json({ Message: 3 });

        const Time = Misc.Time();
        const VoteData = await DB.collection("post_vote").findOne({ $and: [ { Owner: Owner }, { Post: Post } ] });

        if ((VoteData !== undefined && VoteData !== null) || Time > result.Data.Time)
            return res.json({ Message: 4 });

        await DB.collection("post_vote").insertOne({ Owner: Owner, Post: Post, Vote: Vote, Time: Time });

        let Count1 = await DB.collection("post_vote").find({ $and: [ { Vote: "1" }, { Post: Post } ] }).count();
        let Count2 = await DB.collection("post_vote").find({ $and: [ { Vote: "2" }, { Post: Post } ] }).count();
        let Count3 = await DB.collection("post_vote").find({ $and: [ { Vote: "3" }, { Post: Post } ] }).count();
        let Count4 = await DB.collection("post_vote").find({ $and: [ { Vote: "4" }, { Post: Post } ] }).count();
        let Count5 = await DB.collection("post_vote").find({ $and: [ { Vote: "5" }, { Post: Post } ] }).count();

        res.json({ Message: 0, Time: Time, Count1: Count1, Count2: Count2, Count3: Count3, Count4: Count4, Count5: Count5 });
    });
});

module.exports = PostRouter;
