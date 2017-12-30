const PostRouter = require('express').Router();
const Formidable = require('formidable');
const Request    = require('request');
const FS         = require('fs');
const FFMPEG     = require('fluent-ffmpeg');
const UniqueName = require('uuid/v4');
const RateLimit  = require('../Handler/RateLimit');
const Upload     = require('../Handler/Upload');
const Auth       = require('../Handler/Auth');
const Misc       = require('../Handler/Misc');

// For Windows
FFMPEG.setFfmpegPath('./System/FFmpeg/ffmpeg.exe');
FFMPEG.setFfprobePath('./System/FFmpeg/ffprobe.exe');

PostRouter.post('/PostWrite', Auth(), RateLimit(60, 3600), function(req, res)
{
    const Form = new Formidable.IncomingForm();
    Form.uploadDir = "./System/Storage/Temp/";
    Form.encoding = 'utf-8';
    Form.parse(req, async function (error, fields, files)
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

        if (typeof Message === 'undefined')
            Message = "";

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
        let ServerID = await Upload.BestServerID();
        let ServerURL = Upload.ServerURL(ServerID);
        let ServerPass = Upload.ServerToken(ServerID);

        switch (parseInt(Type))
        {
            case 1:
            {
                if (typeof files.Image1 !== 'undefined' && files.Image1 !== null && files.Image1.size < 3145728)
                    Data.push(await UploadImage(ServerURL, ServerPass, files.Image1));

                if (typeof files.Image2 !== 'undefined' && files.Image2 !== null && files.Image1.size < 3145728)
                    Data.push(await UploadImage(ServerURL, ServerPass, files.Image2));

                if (typeof files.Image3 !== 'undefined' && files.Image3 !== null && files.Image1.size < 3145728)
                    Data.push(await UploadImage(ServerURL, ServerPass, files.Image3));
            }
            break;
            case 2:
                if (typeof files.Video !== 'undefined' && files.Video !== null)
                    Data.push(await UploadVideo(ServerURL, ServerPass, files.Video));
            break;
            case 3:
            break;
            case 4:
                if (typeof files.File !== 'undefined' && files.File !== null)
                    Data.push(await UploadFile(ServerURL, ServerPass, files.File));
            break;
        }

        res.json({ Result: 0, Data: Data });
    });
});

function UploadImage(URL, Pass, File)
{
    return new Promise(function(resolve)
    {
        Request.post({ url: URL + "/UploadImage", formData: { Password: Pass, FileImage: FS.createReadStream(File.path) } }, function(error, httpResponse, body)
        {
            try
            {
                FS.unlink(File.path, function() { });
                resolve(JSON.parse(body).Path);
            }
            catch (e)
            {
                Misc.Log("[UploadImage]: " + e);
                resolve();
            }
        });
    });
}

function UploadVideo(URL, Pass, File)
{
    return new Promise(function(resolve)
    {
        if (File.name.split('.').pop().toLowerCase() === ".mp4")
        {
            FFMPEG.ffprobe(File.path, function(error, data)
            {
                let Size = data.format.size * 1000;
                let Duration = data.format.duration * 1000;

                Request.post({ url: URL + "/UploadVideo", formData: { Password: Pass, FileVideo: FS.createReadStream(File.path) } }, function(error, httpResponse, body)
                {
                    try
                    {
                        FS.unlink(File.path, function() { });
                        resolve({ Size: Size, Duration: Duration, URL: JSON.parse(body).Path });
                    }
                    catch (e)
                    {
                        Misc.Log("[UploadVideo]: " + e);
                        resolve();
                    }
                });
            });
        }
        else
        {
            let Video = './System/Storage/Temp/' + UniqueName() + ".mp4";

            FFMPEG(File.path).output(Video).renice(-10).on('end', function()
            {
                FS.unlink(File.path, function() { });

                FFMPEG.ffprobe(Video, function(error, data)
                {
                    let Size = data.format.size * 1000;
                    let Duration = data.format.duration * 1000;

                    Request.post({ url: URL + "/UploadVideo", formData: { Password: Pass, FileVideo: FS.createReadStream(Video) } }, function(error, httpResponse, body)
                    {
                        try
                        {
                            FS.unlink(Video, function() { });
                            resolve({ Size: Size, Duration: Duration, URL: JSON.parse(body).Path });
                        }
                        catch (e)
                        {
                            Misc.Log("[UploadVideo]: " + e);
                            resolve();
                        }
                    });
                });
            }).run();
        }
    });
}

function UploadFile(URL, Pass, File)
{
    return new Promise(function(resolve)
    {
        Request.post({ url: URL + "/UploadFile", formData: { Password: Pass, File: FS.createReadStream(File.path) } }, function(error, httpResponse, body)
        {
            try
            {
                FS.unlink(File.path, function() { });
                resolve({ Size: File.size, URL: JSON.parse(body).Path });
            }
            catch (e)
            {
                Misc.Log("[UploadFile]: " + e);
                resolve();
            }
        });
    });
}

/*PostRouter.post('/PostListInbox', Auth(), RateLimit(10, 60), async function(req, res)
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
    });
});*/

module.exports = PostRouter;
