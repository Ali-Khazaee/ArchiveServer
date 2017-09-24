var FollowRouter = require('express').Router();
var Notification = require('../Handler/Notification');
var RateLimit    = require('../Handler/RateLimit');
var Upload       = require('../Handler/Upload');
var Async        = require('async');
var Auth         = require('../Handler/Auth');
var Misc         = require('../Handler/Misc');

FollowRouter.post('/Follow', Auth(), RateLimit(120, 60), function(req, res)
{
    var Username = req.body.Username;

    if (typeof Username === 'undefined' || Username === '')
        return res.json({ Message: 1 });

    Username = Username.toLowerCase();

    DB.collection("account").findOne({ Username: Username }, { _id: 1 }, function(error, result)
    {
        if (error)
        {
            Misc.Log(error);
            return res.json({ Message: -1 });
        }

        if (result === null)
            return res.json({ Message: 2 });

        var OwnerID = res.locals.ID;
        var FollowerID = result._id;

        if (OwnerID.equals(FollowerID))
            return res.json({ Message: 3 });

        DB.collection("follow").findOne({ $and: [{ OwnerID: OwnerID, Follower: FollowerID }] }, { _id: 1 }, function(error1, result1)
        {
            if (error1)
            {
                Misc.Log(error1);
                return res.json({ Message: -1 });
            }

            if (result1 === null)
            {
                Notification.SendNotification(FollowerID, OwnerID, 7, '');
                DB.collection("follow").removeOne({ $and: [{ OwnerID: OwnerID, Follower: FollowerID }] });
                res.json({ Message: 0, Follow: false });
            }
            else
            {
                Notification.SendNotification(FollowerID, OwnerID, 3, '');
                DB.collection("follow").insertOne({ OwnerID: OwnerID, Follower: FollowerID, Time: Misc.Time });
                res.json({ Message: 0, Follow: true });
            }
        });
    });
});

FollowRouter.post('/FollowingList', Auth(), RateLimit(120, 60), function(req, res)
{
    var Skip = req.body.Skip;
    var Username = req.body.Username;

    if (typeof Username === 'undefined' || Username === '')
        return res.json({ Message: 1 });

    if (typeof Skip === 'undefined' || Skip === '' || Skip === null)
        Skip = 0;

    Username = Username.toLowerCase();

    DB.collection("account").findOne({ Username: Username }, { _id: 1 }, function(error, result)
    {
        if (error)
        {
            Misc.Log(error);
            return res.json({ Message: -1 });
        }

        if (result === null)
            return res.json({ Message: 2 });

        DB.collection("follow").find({ OwnerID: result._id }, { _id: 0, Follower: 1, Time: 1 }).limit(10).sort({ Time: -1 }).skip(Skip).toArray(function(error1, result1)
        {
            if (error1)
            {
                Misc.Log(error1);
                return res.json({ Message: -1 });
            }

            var Result = [];
            var OwnerID = res.locals.ID;

            Async.eachSeries(result1, function(item, callback)
            {
                DB.collection("account").findOne({ _id: item.Follower }, { Username: 1, AvatarServer: 1, Avatar: 1 }, function(error2, result2)
                {
                    if (error2)
                    {
                        Misc.Log(error2);
                        return res.json({ Message: -1 });
                    }

                    if (result2 === null)
                        return callback();

                    DB.collection("follow").findOne({ $and: [{ OwnerID: OwnerID, Follower: result2._id }] }, { _id: 1 }, function(error3, result3)
                    {
                        if (error3)
                        {
                            Misc.Log(error3);
                            return res.json({ Message: -1 });
                        }

                        var Avatar = '';
                        var IsFollow = result3 !== null;

                        if (typeof result2.AvatarServer !== 'undefined' && result2.AvatarServer !== null && typeof result2.Avatar !== 'undefined' && result2.Avatar !== null)
                            Avatar = Upload.ServerURL(result2.AvatarServer) + result2.Avatar;

                        Result.push({ Username: result2.Username, Avatar: Avatar, Time: item.Time, Follow: IsFollow });
                        callback();
                    });
                });
            },
            function()
            {
                res.json({ Message: 0, Result: Result });
            });
        });
    });
});

FollowRouter.post('/FollowersList', Auth(), RateLimit(120, 60), function(req, res)
{
    var Skip = req.body.Skip;
    var Username = req.body.Username;

    if (typeof Username === 'undefined' || Username === '')
        return res.json({ Message: 1 });

    if (typeof Skip === 'undefined' || Skip === '' || Skip === null)
        Skip = 0;

    Username = Username.toLowerCase();

    DB.collection("account").findOne({ Username: Username }, { _id: 1 }, function(error, result)
    {
        if (error)
        {
            Misc.Log(error);
            return res.json({ Message: -1 });
        }

        if (result === null)
            return res.json({ Message: 2 });

        DB.collection("follow").find({ Follower: result._id }, { _id: 0, OwnerID: 1, Time: 1 }).limit(10).sort({ Time: -1 }).skip(Skip).toArray(function(error1, result1)
        {
            if (error1)
            {
                Misc.Log(error1);
                return res.json({ Message: -1 });
            }

            var Result = [];
            var OwnerID = res.locals.ID;

            Async.eachSeries(result1, function(item, callback)
            {
                DB.collection("account").findOne({ _id: item.OwnerID }, { Username: 1, AvatarServer: 1, Avatar: 1 }, function(error2, result2)
                {
                    if (error2)
                    {
                        Misc.Log(error2);
                        return res.json({ Message: -1 });
                    }

                    if (result2 === null)
                        return callback();

                    DB.collection("follow").findOne({ $and: [{ OwnerID: OwnerID, Follower: result2._id }] }, { _id: 1 }, function(error3, result3)
                    {
                        if (error3)
                        {
                            Misc.Log(error3);
                            return res.json({ Message: -1 });
                        }

                        var Avatar = '';
                        var IsFollow = result3 !== null;

                        if (typeof result2.AvatarServer !== 'undefined' && result2.AvatarServer !== null && typeof result2.Avatar !== 'undefined' && result2.Avatar !== null)
                            Avatar = Upload.ServerURL(result2.AvatarServer) + result2.Avatar;

                        Result.push({ Username: result2.Username, Avatar: Avatar, Time: item.Time, Follow: IsFollow });
                        callback();
                    });
                });
            },
            function()
            {
                res.json({ Message: 0, Result: Result });
            });
        });
    });
});

module.exports = FollowRouter;
