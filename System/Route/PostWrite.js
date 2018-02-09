const PostRouter = require('express').Router();
const Formidable = require('formidable');
const RateLimit  = require('../Handler/RateLimit');
const Upload     = require('../Handler/Upload');
const Auth       = require('../Handler/Auth');
const Post       = require('../Handler/Post');
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
            Misc.Log("[PostWrite]: " + error);
            return res.json({ Message: -7 });
        }

        let Message = fields.Message;
        let Category = fields.Category;
        const Type = parseInt(fields.Type);
        const Vote = fields.Vote;
        let World = fields.World;

        if (Type === undefined || isNaN(Type) || Type === null || Type === '' || Type > 4 || Type < 0)
            return res.json({ Message: 1 });

        if (Type === 0 && (Message === undefined || Message.length < 30))
            return res.json({ Message: 2 });

        if (Category === undefined || Category === '' || Category > 22 || Category < 1)
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

        const Data = [];
        const ServerID = await Upload.BestServerID();
        const ServerURL = Upload.ServerURL(ServerID);
        const ServerPass = Upload.ServerToken(ServerID);

        switch (Type)
        {
            case 1:
            {
                if (files.Image1 === undefined || files.Image1 === null || files.Image1.size > 6291456)
                    return res.json({ Message: 3 });

                Data.push(await Post.UploadImage(ServerURL, ServerPass, files.Image1));

                if (files.Image2 !== undefined && files.Image2 !== null && files.Image1.size < 6291456)
                    Data.push(await Post.UploadImage(ServerURL, ServerPass, files.Image2));

                if (files.Image3 !== undefined && files.Image3 !== null && files.Image1.size < 6291456)
                    Data.push(await Post.UploadImage(ServerURL, ServerPass, files.Image3));
            }
            break;
            case 2:
                if (files.Video === undefined || files.Video === null)
                    return res.json({ Message: 3 });

                Data.push(await Post.UploadVideo(ServerURL, ServerPass, files.Video));
            break;
            case 3:
                try
                {
                    let VoteObj = JSON.parse(Vote);

                    if (VoteObj.Vote1 === undefined || VoteObj.Vote1.length <= 0 || VoteObj.Vote2 === undefined || VoteObj.Vote2.length <= 0 || VoteObj.Time === undefined || VoteObj.Time < Misc.Time())
                        return res.json({ Message: 3 });

                    let VoteObj2 = { Vote1: VoteObj.Vote1, Vote2: VoteObj.Vote2, Time: VoteObj.Time };

                    if (VoteObj.Vote3 !== undefined && VoteObj.Vote3.length > 0)
                        VoteObj2.Vote3 = VoteObj.Vote3;

                    if (VoteObj.Vote4 !== undefined && VoteObj.Vote4.length > 0)
                        VoteObj2.Vote4 = VoteObj.Vote4;

                    if (VoteObj.Vote5 !== undefined && VoteObj.Vote5.length > 0)
                        VoteObj2.Vote5 = VoteObj.Vote5;

                    Data.push(VoteObj2);
                }
                catch (e)
                {
                    Misc.Log("[PostWrite-2]: " + e);
                    return res.json({ Message: 3 });
                }
            break;
            case 4:
                if (files.File === undefined || files.File === null)
                    return res.json({ Message: 3 });

                Data.push(await Post.UploadFile(ServerURL, ServerPass, files.File));
            break;
        }

        const Owner = res.locals.ID;
        const Result = { Owner: Owner, World: World, Category: Category, Type: Type, Time: Misc.Time() };

        if (Type === 1 || Type === 2 || Type === 4)
            Result.Server = ServerID;

        if (ResultMessage !== undefined && ResultMessage.length > 0)
            Result.Message = ResultMessage;

        if (Type === 1)
            Result.Data = Data;
        else if (Type === 2 || Type === 3 || Type === 4)
            Result.Data = Data[0];

        await DB.collection("post").insertOne(Result);

        if (ResultMessage !== undefined && ResultMessage.length > 0)
        {
            let AccountList = ResultMessage.match(/@(\w+)/gi);

            if (AccountList !== null)
            {
                for (let I = 0; I < AccountList.length; I++)
                {
                    let Account = await DB.collection("account").find({ Username: AccountList[I] }).project({ Username: 1 }).limit(1).toArray();

                    if (Account[0].Username === undefined || Account[0].Username === '' || Account[0].Username === null)
                        continue;

                    if (Account[0]._id !== Owner)
                    {
                        // TODO Add Notification
                    }
                }
            }

            let TagList = ResultMessage.match(/#(\w+)/ugi);

            if (TagList !== null)
                for (let I = 0; I < TagList.length; I++)
                    DB.collection("tag").updateOne({ Tag: TagList[I].toLowerCase().slice(1) }, { $set: { Tag: TagList[I].toLowerCase().slice(1) } }, { upsert: true });
        }

        if (Result.Server !== undefined && Result.Server !== null)
        {
            let Server = Upload.ServerURL(Result.Server);

            if (Result.Type === 2 || Result.Type === 4)
                Result.Data.URL = Server + Result.Data.URL;

            if (Result.Type === 1)
                Result.Data.forEach(function(c, i) { Result.Data[i] = Server + c; });
        }

        res.json({ Message: 0, Result: Result });
    });
});

module.exports = PostRouter;
