const PostRouter = require('express').Router();
const Formidable = require('formidable');
const RateLimit  = require('../Handler/RateLimit');
const Upload     = require('../Handler/Upload');
const Auth       = require('../Handler/Auth');
const Post       = require('../Model/Post');
const Misc       = require('../Handler/Misc');

PostRouter.post('/PostWrite', Auth(), RateLimit(60, 1800), function(req, res)
{
    const Form = new Formidable.IncomingForm();
    Form.uploadDir = "./System/Storage/Temp/";
    Form.encoding = 'utf-8';
    Form.parse(req, async function (error, fields, files)
    {
        if (error)
        {
            Misc.Log("[PostWrite-Formidable]: " + error);
            return res.json({ Result: -7 });
        }

        let Message = fields.Message;
        let Category = fields.Category;
        let Type = parseInt(fields.Type);
        let Vote = fields.Vote;
        let World = fields.World;

        if (Type === undefined || Type === '')
            return res.json({ Result: 1 });

        if (Type === 0 && Message !== undefined && Message.length < 20)
            return res.json({ Result: 2 });

        if (Message === undefined)
            Message = "";

        if (Category === undefined || Category === '' || Category > 21 || Category < 1)
            Category = 100;

        if (Message !== undefined && Message.length > 300)
            Message = Message.substr(0, 300);

        if (World === undefined || World === '')
            World = 0;

        let NewLine = 0;
        let ResultMessage = "";

        for (let I = 0; I < Message.length; I++)
        {
            if (Message.charCodeAt(I) === 10)
                NewLine++;

            if (NewLine > 4 && Message.charCodeAt(I) === 10)
                continue;

            ResultMessage += Message[I];
        }

        let Data = [];
        let ServerID = await Upload.BestServerID();
        let ServerURL = Upload.ServerURL(ServerID);
        let ServerPass = Upload.ServerToken(ServerID);

        switch (Type)
        {
            case 1:
            {
                if (files.Image1 !== undefined && files.Image1 !== null && files.Image1.size < 3145728)
                    Data.push(await Post.UploadImage(ServerURL, ServerPass, files.Image1));

                if (files.Image2 !== undefined && files.Image2 !== null && files.Image1.size < 3145728)
                    Data.push(await Post.UploadImage(ServerURL, ServerPass, files.Image2));

                if (files.Image3 !== undefined && files.Image3 !== null && files.Image1.size < 3145728)
                    Data.push(await Post.UploadImage(ServerURL, ServerPass, files.Image3));
            }
            break;
            case 2:
                if (files.Video !== undefined && files.Video !== null)
                    Data.push(await Post.UploadVideo(ServerURL, ServerPass, files.Video));
            break;
            case 3:
                try
                {
                    let VoteObj = JSON.parse(Vote);

                    if (VoteObj.Vote1 === undefined || VoteObj.Vote1.length <= 0 || VoteObj.Vote2 === undefined || VoteObj.Vote2.length <= 0)
                        return res.json({ Result: 3 });

                    let VoteObj2 = { Vote1: VoteObj.Vote1, Val1: 0, Vote2: VoteObj.Vote2, Val2: 0 };

                    if (VoteObj.Vote3 !== undefined && VoteObj.Vote3.length > 0)
                    {
                        VoteObj2.Vote3 = VoteObj.Vote3;
                        VoteObj2.Val3 = 0;
                    }

                    if (VoteObj.Vote4 !== undefined && VoteObj.Vote4.length > 0)
                    {
                        VoteObj2.Vote4 = VoteObj.Vote4;
                        VoteObj2.Val4 = 0;
                    }

                    if (VoteObj.Vote5 !== undefined && VoteObj.Vote5.length > 0)
                    {
                        VoteObj2.Vote5 = VoteObj.Vote5;
                        VoteObj2.Val5 = 0;
                    }

                    Data.push(VoteObj2);
                }
                catch (e)
                {
                    Misc.Log("[PostWrite-Type-3]: " + e);
                    return res.json({ Result: 3 });
                }
            break;
            case 4:
                if (files.File !== undefined && files.File !== null)
                    Data.push(await Post.UploadFile(ServerURL, ServerPass, files.File));
            break;
        }

        let Owner = res.locals.ID;
        let Result = { Owner: Owner, World: World, Category: Category, Type: Type, Time: Misc.Time() };

        if (Type === 1 || Type === 2 || Type === 4)
            Result.Server = ServerID;

        if (ResultMessage !== undefined && ResultMessage.length > 0)
            Result.Message = ResultMessage;

        if (Type === 1)
            Result.Data = Data;
        else if (Type === 2)
            Result.Data = Data[0];
        else if (Type === 4)
            Result.Data = Data[0];

        await DB.collection("post").insertOne(Result);

        if (Type === 1 || Type === 2 || Type === 4)
            Result.URL = ServerURL;

        if (ResultMessage !== undefined && ResultMessage.length > 0)
        {
            let UsernameList = ResultMessage.match(/@(\w+)/gi);

            if (UsernameList !== null)
            {
                for (let I = 0; I < UsernameList.length; I++)
                {
                    let Account = await DB.collection("account").find({ Username: UsernameList[I] }).project({ Username: 1 }).limit(1).toArray();

                    if (Account[0].Username === undefined || Account[0].Username === '' || Account[0].Username === null)
                        continue;

                    if (Account[0]._id !== Owner)
                    {
                        // TODO Add Notification
                        // TODO Send Notification
                    }
                }
            }

            let TagList = ResultMessage.match(/#(\w+)/ugi);

            if (TagList !== null)
                for (let I = 0; I < TagList.length; I++)
                    DB.collection("tag").updateOne({ Tag: TagList[I].toLowerCase() }, { $set: { Tag: TagList[I].toLowerCase() } }, { upsert: true });
        }

        res.json({ Message: 0, Result: Result });
    });
});

PostRouter.post('/PostListInbox', Auth(), RateLimit(30, 60), async function(req, res)
{
    const ID = res.locals.ID;

    DB.collection("follow").find({ Following: ID }, { _id: 0, Follower: 1 }).toArray(function(error, result)
    {
        if (error)
        {
            Misc.Log("[PostListInbox-DB-1]: " + error);
            return res.json({ Message: -1 });
        }

        let PeopleList = [ID];

        for (const item of result) { PeopleList.push(item.Follower); }

        let Count = 0;
        let PostList = [];
        let Size = PeopleList.length;

        for (const item of PeopleList)
        {
            DB.collection("post").find({ Owner: item, World: '0' }, { _id: 1, Time: 1 }).sort({ Time : -1 }).limit(8).toArray(function(error, result)
            {
                if (error)
                {
                    Misc.Log("[PostListInbox-DB-2]: " + error);
                    return res.json({ Message: -1 });
                }

                for (const item2 of result) { PostList.push({ ID: item2._id, Time: item2.Time }); }

                if (++Count >= Size)
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

                    let Skip = req.body.Skip;

                    if (Skip === undefined || Skip === '' || Skip === null)
                        Skip = 0;

                    PostList = PostList.slice(Skip, Skip + 8);

                    Count = 0;
                    let Result = [];
                    let Size = PostList.length;

                    for (const item of PostList)
                    {
                        DB.collection("post").findOne({ _id: item.ID }, async function(error, result)
                        {
                            if (error)
                            {
                                Misc.Log("[PostListInbox-DB-3]: " + error);
                                return res.json({ Message: -1 });
                            }

                            let Avatar = '';
                            let Account = await DB.collection("account").find({ _id: result.Owner }).project({ _id: 0, Name: 1, Medal: 1, Username: 1, Avatar: 1, AvatarServer: 1 }).limit(1).toArray();
                            let IsLike = await DB.collection("post_like").find({ $and: [ { Owner: ID }, { PostID: result._id } ] }).count();
                            let IsFollow = await DB.collection("follow").find({ $and: [ { Following: ID }, { Follower: result.Owner } ] }).count();
                            let IsBookmark = await DB.collection("post_bookmark").find({ $and: [ { Owner: ID }, { PostID: result._id } ] }).count();
                            let LikeCount = await DB.collection("post_like").find({ PostID: result._id }).count();
                            let CommentCount = await DB.collection("post_comment").find({ PostID: result._id }).count();

                            if (Account[0].Avatar !== undefined && Account[0].Avatar !== null && Account[0].AvatarServer !== undefined && Account[0].AvatarServer !== null)
                                Avatar = Upload.ServerURL(Account[0].AvatarServer) + Account[0].Avatar;

                            if (result.Server !== undefined && result.Server !== null)
                            {
                                let Server = Upload.ServerURL(result.Server);

                                if (result.Type === 2 || result.Type === 4)
                                    result.Data.URL = Server + result.Data.URL;

                                if (result.Type === 1)
                                    result.Data.forEach(function(c, i) { result.Data[i] = Server + c; });
                            }

                            Result.push({
                                ID: result._id,
                                Profile: Avatar,
                                Name: Account[0].Name,
                                Medal: Account[0].Medal,
                                Username: Account[0].Username,
                                Time: result.Time,
                                Message: result.Message,
                                Type: result.Type,
                                Data: result.Data,
                                Owner: result.Owner,
                                View: result.View,
                                Category: result.Category,
                                LikeCount: LikeCount,
                                CommentCount: CommentCount,
                                Like: IsLike,
                                Follow: IsFollow,
                                Comment: result.Comment,
                                Bookmark: IsBookmark });

                            if (++Count >= Size)
                                res.json({ Message: 0, Result: Result });
                        });
                    }
                }
            });
        }
    });
});

module.exports = PostRouter;
