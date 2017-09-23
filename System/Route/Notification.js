var NotificationRouter = require('express').Router();
var RateLimit          = require('../Handler/RateLimit');
var Upload             = require('../Handler/Upload');
var Async              = require('async');
var Auth               = require('../Handler/Auth');
var Misc               = require('../Handler/Misc');

NotificationRouter.post('/Notification', Auth(), RateLimit(60, 60), function(req, res)
{
    var Notification = req.body.Notification;

    if (typeof Notification === 'undefined' || Notification === '' || Notification === null)
        Notification = true;
    else
        Notification = !(Notification === 'true');

    DB.collection("account").updateOne({ _id: res.locals.ID }, { $set: { Notification: Notification }}, function(error, result)
    {
        if (error)
        {
            Misc.FileLog(error);
            return res.json({ Message: -1 });
        }

        res.json({ Message: 0 });
    });
});

NotificationRouter.post('/NotificationList', Auth(), RateLimit(60, 60), function(req, res)
{
    var Skip = req.body.Skip;

    if (typeof Skip === 'undefined' || Skip === '' || Skip === null)
        Skip = 0;

    DB.collection("notification").find({ OwnerID: res.locals.ID }).limit(10).sort({ Time: -1}).skip(Skip).toArray(function(error, result)
    {
        if (error)
        {
            Misc.FileLog(error);
            return res.json({ Message: -1 });
        }

        var Result = [];

        Async.eachSeries(result, function(item, callback)
        {
            DB.collection("account").findOne({ _id: item.SenderID }, { _id: 0, Username: 1, AvatarServer: 1, Avatar: 1 }, function(error1, result1)
            {
                if (error1)
                {
                    Misc.FileLog(error1);
                    return res.json({ Message: -1 });
                }

                if (result === null)
                    return callback();

                var Avatar = '';

                if (typeof result1.AvatarServer !== 'undefined' && result1.AvatarServer !== null && typeof result1.Avatar !== 'undefined' && result1.Avatar !== null)
                    Avatar = Upload.ServerURL(result1.AvatarServer) + result1.Avatar;

                Result.push({ Username: result1.Username, Avatar: Avatar, Type: item.Type, Time: item.Time, PostID: (item !== 'undefined') ? item.PostID : '' });
                callback();
            });
        },
        function()
        {
            res.json({ Message: 0, Result: Result });
        });
    });
});

module.exports = NotificationRouter;
