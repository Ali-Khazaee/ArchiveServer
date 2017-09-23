var FollowRouter = require('express').Router();
var RateLimit    = require('../Handler/RateLimit');
var Auth         = require('../Handler/Auth');
var Misc         = require('../Handler/Misc');

FollowRouter.post('/Follow', Auth(), RateLimit(120, 60), function(req, res)
{
    var Username = req.body.Username;

    if (typeof Username === 'undefined' || Username === '')
        return res.json({ Message: 1 });

    if (Username.length < 3)
        return res.json({ Message: 2 });

    if (Username.length > 32)
        return res.json({ Message: 3 });

    Username = Username.toLowerCase();

    if (Username.search(/^(?![^a-z])(?!.*([_.])\1)[\w.]*[a-z]$/) === -1)
        return res.json({ Message: 4 });

    DB.collection("account").findOne({ Username: Username }, { _id: 1 }, function(error, result)
    {
        if (error)
        {
            Misc.FileLog(error);
            return res.json({ Message: -1 });
        }

        if (result === null)
            return res.json({ Message: 5 });

        var OwnerID = new MongoID(res.locals.ID);
        var FollowerID = new MongoID(result._id);

        if (OwnerID.equals(FollowerID))
            return res.json({ Message: 6 });

        DB.collection("follow").findOne({ $and: [{ OwnerID: OwnerID, Follower: FollowerID }] }, { _id: 1 }, function(error, result)
        {
            if (error)
            {
                Misc.FileLog(error);
                return res.json({ Message: -1 });
            }

            if (result === null)
            {
                if (ClientList[FollowerID].Socket !== null)
                {
                    ClientList[FollowerID].Socket.emit('Notification', { Type: 7 });
                    DB.collection("notification").insertOne({ OwnerID: FollowerID, SenderID: OwnerID, Type: 7, Seen: 1, Time: Misc.Time });
                }
                else
                {
                    DB.collection("notification").insertOne({ OwnerID: FollowerID, SenderID: OwnerID, Type: 7, Seen: 0, Time: Misc.Time });
                }

                DB.collection("follow").removeOne({ $and: [{ OwnerID: OwnerID, Follower: FollowerID }] });
                res.json({ Message: 0, Follow: false });
            }
            else
            {
                DB.collection("follow").insertOne({ OwnerID: OwnerID, Follower: FollowerID, Time: Misc.Time });
                DB.collection("notification").insertOne({ OwnerID: FollowerID, SenderID: OwnerID, Type: 3, Seen: 0, Time: Misc.Time });
                res.json({ Message: 0, Follow: true });
            }
        });
    });
});

FollowRouter.post('/FollowingList', Auth(), RateLimit(120, 60), function(req, res)
{
    var Username = req.body.Username;

    if (typeof Username === 'undefined' || Username === '')
        return res.json({ Message: 1 });

    if (Username.length < 3)
        return res.json({ Message: 2 });

    if (Username.length > 32)
        return res.json({ Message: 3 });

    Username = Username.toLowerCase();

    if (Username.search(/^(?![^a-z])(?!.*([_.])\1)[\w.]*[a-z]$/) === -1)
        return res.json({ Message: 4 });

    DB.collection("account").findOne({ Username: Username }, { _id: 1 }, function(error, result)
    {
        if (error)
        {
            Misc.FileLog(error);
            return res.json({ Message: -1 });
        }

        if (result === null)
            return res.json({ Message: 5 });

        var OwnerID = new MongoID(res.locals.ID);
        var FollowerID = new MongoID(result._id);

        if (OwnerID.equals(FollowerID))
            return res.json({ Message: 6 });

        DB.collection("follow").findOne({ $and: [{ OwnerID: OwnerID, Follower: FollowerID }] }, { _id: 1 }, function(error, result)
        {
            if (error)
            {
                Misc.FileLog(error);
                return res.json({ Message: -1 });
            }

            if (result === null)
            {
                if (ClientList[FollowerID].Socket !== null)
                {
                    ClientList[FollowerID].Socket.emit('Notification', { Type: 7 });
                    DB.collection("notification").insertOne({ OwnerID: FollowerID, SenderID: OwnerID, Type: 7, Seen: 1, Time: Misc.Time });
                }
                else
                {
                    DB.collection("notification").insertOne({ OwnerID: FollowerID, SenderID: OwnerID, Type: 7, Seen: 0, Time: Misc.Time });
                }

                DB.collection("follow").removeOne({ $and: [{ OwnerID: OwnerID, Follower: FollowerID }] });
                res.json({ Message: 0, Follow: false });
            }
            else
            {
                DB.collection("follow").insertOne({ OwnerID: OwnerID, Follower: FollowerID, Time: Misc.Time });
                DB.collection("notification").insertOne({ OwnerID: FollowerID, SenderID: OwnerID, Type: 3, Seen: 0, Time: Misc.Time });
                res.json({ Message: 0, Follow: true });
            }
        });
    });
});

module.exports = FollowRouter;

/*
    1 Post Tag
    2 Post Like
    3 Follow
    4 Comment Like
    5 Post Comment
    6 Mention
    7 Unfollow
    8 Post Comment Delete - Need To implement
*/
