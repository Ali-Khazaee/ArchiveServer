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
            DB.collection("post").find({ Owner: People, Time: { $gt: Time } }).project({ Time: 1 }).sort({ Time : -1 }).toArray(function(error, result)
            {
                if (error)
                {
                    Misc.Log("[PostListInbox-Post]: " + error);
                    return res.json({ Message: -1 });
                }

                for (const Post of result) { PostList.push({ ID: Post._id, Time: Post.Time }); }

                if (++Count >= PeopleList.length)
                {
                    if (PostList.length === 0)
                        return res.json({ Message: 0 });

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
                            const Account = await DB.collection("account").find({ _id: result.Owner }).project({ _id: 0, Name: 1, Medal: 1, Username: 1, Avatar: 1, AvatarServer: 1 }).limit(1).toArray();
                            const IsLike = await DB.collection("post_like").find({ $and: [ { Owner: Owner }, { Post: result._id } ] }).count();
                            const IsFollow = await DB.collection("follow").find({ $and: [ { Following: Owner }, { Follower: result.Owner } ] }).count();
                            const IsBookmark = await DB.collection("post_bookmark").find({ $and: [ { Owner: Owner }, { Post: result._id } ] }).count();
                            const LikeCount = await DB.collection("post_like").find({ Post: result._id }).count();
                            const CommentCount = await DB.collection("post_comment").find({ Post: result._id }).count();

                            if (Account[0].Avatar !== undefined && Account[0].Avatar !== null && Account[0].AvatarServer !== undefined && Account[0].AvatarServer !== null)
                                Avatar = Upload.ServerURL(Account[0].AvatarServer) + Account[0].Avatar;

                            if (result.Type === 3)
                            {
                                let Vote = await DB.collection("post_vote").findOne({ $and: [ { Owner: Owner }, { Post: result._id } ] });

                                if ((Vote !== undefined && Vote !== null) || result.Data.Time < Misc.Time())
                                {
                                    let Count1 = await DB.collection("post_vote").find({ $and: [ { Vote: "1" }, { Post: result._id } ] }).count();
                                    let Count2 = await DB.collection("post_vote").find({ $and: [ { Vote: "2" }, { Post: result._id } ] }).count();
                                    let Count3 = await DB.collection("post_vote").find({ $and: [ { Vote: "3" }, { Post: result._id } ] }).count();
                                    let Count4 = await DB.collection("post_vote").find({ $and: [ { Vote: "4" }, { Post: result._id } ] }).count();
                                    let Count5 = await DB.collection("post_vote").find({ $and: [ { Vote: "5" }, { Post: result._id } ] }).count();

                                    result.Data.Vote = Vote === null ? 0 : Vote.Vote;
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

                            const PersonList = await DB.collection("post_like").aggregate([ { "$sort": { "Time": -1 } },
                                { "$lookup": { "from": "account", "localField": "Owner", "foreignField": "_id", "as": "Data" } },
                                { "$unwind": "$Data" },
                                { "$project": { "_id": 0, "Data._id": 1, "Data.Avatar": 1, "Data.AvatarServer": 1 } },
                                { "$group": { "_id": { "ID": "$Data._id", "Avatar": "$Data.Avatar", "Server": "$Data.AvatarServer" } } } ]).toArray();

                            let PersonCount = 0;
                            const NewPost = { ID: result._id, Profile: Avatar, Name: Account[0].Name, Medal: Account[0].Medal, Username: Account[0].Username,
                                           Time: result.Time, Message: result.Message, Type: result.Type, Data: result.Data, Owner: result.Owner,
                                           View: result.View, Category: result.Category, LikeCount: LikeCount, CommentCount: CommentCount, Like: IsLike,
                                           Follow: IsFollow, Comment: result.Comment, Bookmark: IsBookmark };

                            for (const Person of PersonList)
                            {
                                if (PersonCount > 3 || Person._id.ID === result.Owner || Person._id.ID === Owner || Person._id.Avatar === undefined || Person._id.Avatar === null || Person._id.Avatar === '')
                                    continue;

                                let Profile = Upload.ServerURL(Person._id.Server) + Person._id.Avatar;

                                switch (PersonCount)
                                {
                                    case 0: NewPost.I1 = Person._id.ID; NewPost.I1P = Profile; break;
                                    case 1: NewPost.I2 = Person._id.ID; NewPost.I2P = Profile; break;
                                    case 2: NewPost.I3 = Person._id.ID; NewPost.I3P = Profile; break;
                                    case 3: NewPost.I4 = Person._id.ID; NewPost.I4P = Profile; break;
                                }

                                PersonCount++;
                            }

                            Result.push(NewPost);

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
