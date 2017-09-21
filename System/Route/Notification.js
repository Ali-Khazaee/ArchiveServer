var NotificationRouter = require('express').Router();
var RateLimit          = require('../Handler/RateLimit');
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

        console.log(result);

    });
});

module.exports = NotificationRouter;
