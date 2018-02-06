const PostRouter = require('express').Router();
const RateLimit  = require('../Handler/RateLimit');
const Upload     = require('../Handler/Upload');
const Auth       = require('../Handler/Auth');
const Misc       = require('../Handler/Misc');

PostRouter.post('/PostListInbox', Auth(), RateLimit(30, 60), async function(req, res)
{
    const Owner = res.locals.ID;

    DB.collection("follow").find({ Following: Owner }, { _id: 0, Follower: 1 }).toArray(function(error, result)
    {
        if (error)
        {
            Misc.Log("[PostListInbox]: " + error);
            return res.json({ Message: -1 });
        }

        let PeopleList = [ Owner ];

        for (const item of result) { PeopleList.push(item.Follower); }

        let Count = 0;
        let PostList = [];

        let Time = parseInt(req.body.Time);

        if (Time === undefined || isNaN(Time) || Time === '' || Time === null)
            Time = 0;

        for (const People of PeopleList)
        {
            DB.collection("post").find({ Owner: People, Time: { $gte: Time } }).project({ Time: 1 }).sort({ Time : -1 }).toArray(function(error, result)
            {
                if (error)
                {
                    Misc.Log("[PostListInbox-Post]: " + error);
                    return res.json({ Message: -1 });
                }

                for (const Post of result) { PostList.push({ ID: Post._id, Time: Post.Time }); }

                if (++Count >= PeopleList.length)
                {
                    // Sort By Value
                    PostList.sort(function(A, B)
                    {
                        if (A["Time"] > B["Time"])
                            return -1;

                        if (A["Time"] < B["Time"])
                            return 1;

                        return 0;
                    });

                    let Skip = parseInt(req.body.Skip);

                    if (Skip === undefined || isNaN(Skip) || Skip === '' || Skip === null)
                        Skip = 0;

                    // Cut List Keep 8x
                    PostList = PostList.slice(Skip, Skip + 8);

                    Count = 0;
                    let Result = [];

                    for (const Post of PostList)
                    {
                        DB.collection("post").findOne({ _id: Post.ID }, async function(error, result)
                        {
                            if (error)
                            {
                                Misc.Log("[PostListInbox-Post-2]: " + error);
                                return res.json({ Message: -1 });
                            }

                            let Avatar = '';
                            let Account = await DB.collection("account").find({ _id: result.Owner }).project({ _id: 0, Name: 1, Medal: 1, Username: 1, Avatar: 1, AvatarServer: 1 }).limit(1).toArray();
                            let IsLike = await DB.collection("post_like").find({ $and: [ { Owner: Owner }, { Post: result._id } ] }).count();
                            let IsFollow = await DB.collection("follow").find({ $and: [ { Following: Owner }, { Follower: result.Owner } ] }).count();
                            let IsBookmark = await DB.collection("post_bookmark").find({ $and: [ { Owner: Owner }, { Post: result._id } ] }).count();
                            let LikeCount = await DB.collection("post_like").find({ Post: result._id }).count();
                            let CommentCount = await DB.collection("post_comment").find({ Post: result._id }).count();

                            if (Account[0].Avatar !== undefined && Account[0].Avatar !== null && Account[0].AvatarServer !== undefined && Account[0].AvatarServer !== null)
                                Avatar = Upload.ServerURL(Account[0].AvatarServer) + Account[0].Avatar;

                            if (result.Type === 3)
                            {
                                let Vote = await DB.collection("post_vote").findOne({ $and: [ { Owner: Owner }, { Post: result._id } ] });

                                if (Vote !== undefined && Vote !== null)
                                {
                                    let Count1 = await DB.collection("post_vote").find({ $and: [ { Vote: "1" }, { Post: result._id } ] }).count();
                                    let Count2 = await DB.collection("post_vote").find({ $and: [ { Vote: "2" }, { Post: result._id } ] }).count();
                                    let Count3 = await DB.collection("post_vote").find({ $and: [ { Vote: "3" }, { Post: result._id } ] }).count();
                                    let Count4 = await DB.collection("post_vote").find({ $and: [ { Vote: "4" }, { Post: result._id } ] }).count();
                                    let Count5 = await DB.collection("post_vote").find({ $and: [ { Vote: "5" }, { Post: result._id } ] }).count();

                                    result.Data.Vote = Vote.Vote;
                                    result.Data.Count1 = Count1;
                                    result.Data.Count2 = Count2;
                                    result.Data.Count3 = Count3;
                                    result.Data.Count4 = Count4;
                                    result.Data.Count5 = Count5;
                                }
                            }

                            if (result.Server !== undefined && result.Server !== null)
                            {
                                let Server = Upload.ServerURL(result.Server);

                                if (result.Type === 2 || result.Type === 4)
                                    result.Data.URL = Server + result.Data.URL;

                                if (result.Type === 1)
                                    result.Data.forEach(function(c, i) { result.Data[i] = Server + c; });
                            }

                            Result.push({ ID: result._id, Profile: Avatar, Name: Account[0].Name, Medal: Account[0].Medal, Username: Account[0].Username,
                                          Time: result.Time, Message: result.Message, Type: result.Type, Data: result.Data, Owner: result.Owner,
                                          View: result.View, Category: result.Category, LikeCount: LikeCount, CommentCount: CommentCount, Like: IsLike,
                                          Follow: IsFollow, Comment: result.Comment, Bookmark: IsBookmark });

                            if (++Count >= PostList.length)
                                res.json({ Message: 0, Result: Result });
                        });
                    }
                }
            });
        }
    });
});

module.exports = PostRouter;
