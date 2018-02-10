const PostRouter = require('express').Router();
const RateLimit  = require('../Handler/RateLimit');
const Auth       = require('../Handler/Auth');
const Misc       = require('../Handler/Misc');

PostRouter.post('/PostVote', Auth(), RateLimit(30, 60), async function(req, res)
{
    const Vote = req.body.Vote;

    if (Vote === undefined || (Vote > 5 && Vote < 1))
        return res.json({ Message: 1 });

    const PostID = MongoID(req.body.Post);

    if (PostID === undefined || PostID === '')
        return res.json({ Message: 2 });

    const Post = await DB.collection("post").aggregate([ { $match: { _id: PostID } }, { $group: { _id: { ID: "$_id", Data: "$Data" }, Count: { $sum: 1 } } } ]).toArray();

    if (Post[0].Count === undefined || Post[0].Count === null)
        return res.json({ Message: 2 });

    const Time = Misc.Time();
    const Owner = res.locals.ID;
    const VoteData = await DB.collection("post_vote").findOne({ $and: [ { Owner: Owner }, { Post: PostID } ] });

    if ((VoteData !== undefined && VoteData !== null) || Time > Post[0]._id.Data.Time)
        return res.json({ Message: 4 });

    await DB.collection("post_vote").insertOne({ Owner: Owner, Post: PostID, Vote: Vote, Time: Time });

    let Count1 = await DB.collection("post_vote").find({ $and: [ { Vote: "1" }, { Post: PostID } ] }).count();
    let Count2 = await DB.collection("post_vote").find({ $and: [ { Vote: "2" }, { Post: PostID } ] }).count();
    let Count3 = await DB.collection("post_vote").find({ $and: [ { Vote: "3" }, { Post: PostID } ] }).count();
    let Count4 = await DB.collection("post_vote").find({ $and: [ { Vote: "4" }, { Post: PostID } ] }).count();
    let Count5 = await DB.collection("post_vote").find({ $and: [ { Vote: "5" }, { Post: PostID } ] }).count();

    res.json({ Message: 0, Count1: Count1, Count2: Count2, Count3: Count3, Count4: Count4, Count5: Count5 });
});

module.exports = PostRouter;
