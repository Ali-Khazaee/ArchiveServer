const PostRouter = require('express').Router();
const Formidable = require('formidable');
const RateLimit  = require('../Handler/RateLimit');
const Upload     = require('../Handler/Upload');
const Auth       = require('../Handler/Auth');
const Misc       = require('../Handler/Misc');
const Post       = require('../Model/Post');

PostRouter.post('/PostWrite', Auth(), RateLimit(60, 3600), async function(req, res)
{
    const Form = new Formidable.IncomingForm();
    Form.uploadDir = "./System/Storage/Temp/";
    Form.encoding = 'utf-8';
    Form.parse(req, function (error, fields, files)
    {
        if (error)
        {
            Misc.Log("[Formidable]: " + error);
            return res.json({ Result: -7 });
        }

        let Message = fields.Message;
        let Category = fields.Category;
        let Type = fields.Type;
        let Vote = fields.Vote;
        let World = fields.World;

        if (typeof Type === 'undefined' || Type === '')
            return res.json({ Result: 1 });

        if (Type === 0 && typeof Message !== 'undefined' && Message.length < 20)
            return res.json({ Result: 2 });

        if (typeof Category === 'undefined' || Category === '' || Category > 21 || Category < 1)
            Category = 100;

        if (typeof Message !== 'undefined' && Message.length > 300)
            Message = Message.substr(0, 300);

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
        let ServerID = Upload.BestServerID();
        let ServerURL = Upload.ServerURL(ServerID);

        switch (Type)
        {
            case 1:
                break;
            case 2:
                break;
            case 3:
                break;
            case 4:
                break;
        }


        if (Config.PASSWORD === fields.Password)
        {
            if (typeof files.FileImage === 'undefined' || files.FileImage === null)
                return res.json({ Result: 3 });

            var CurrentDate = new Date();
            var Directory = './System/Storage/' + CurrentDate.getFullYear() + '/' + CurrentDate.getMonth() + '/' + CurrentDate.getDate() + '/';

            mkdir(Directory, function (error2)
            {
                if (error2)
                    return res.json({ Result: 4, Error: error2 });

                var OldPath = files.FileImage.path;
                var NewPath = Directory + UniqueName() + ".jpg";

                fs.rename(OldPath, NewPath, function (error3)
                {
                    if (error3)
                        return res.json({ Result: 5, Error: error3 });

                    res.json({ Result: 0, Path: NewPath.substring(16) });
                });
            });
        }
        else
        {
            res.json({ Result: 1 });
        }
    });
});

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
