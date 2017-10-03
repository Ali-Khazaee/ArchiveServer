var Misc   = require('../Handler/Misc');
var Upload = require('../Handler/Upload');
var Async  = require('async');

function SendAllNotification(OwnerID)
{
    DB.collection("notification").find({ OwnerID: new MongoID(OwnerID), Seen: 0 }, { _id: 0, OwnerID: 1, SenderID: 1, Type: 1, PostID: 1 }).limit(10).sort({ Time: -1 }).toArray(function(error, result)
    {
        if (error1)
        {
            Misc.Log(error);
            return;
        }

        Async.eachSeries(result, function(item, callback)
        {
            DB.collection("account").findOne({ _id: item.SenderID }, { _id: 0, Username: 1, AvatarServer: 1, Avatar: 1 }, function(error1, result1)
            {
                if (error1)
                {
                    Misc.Log(error1);
                    return callback();
                }

                if (result1 === null)
                    return callback();

                var Avatar = '';

                if (typeof result1.AvatarServer !== 'undefined' && result1.AvatarServer !== null && typeof result1.Avatar !== 'undefined' && result1.Avatar !== null)
                    Avatar = Upload.ServerURL(result1.AvatarServer) + result1.Avatar;

                SendNotification(item.OwnerID, item.SenderID, item.Type, Avatar, (item.PostID !== 'undefined') ? item.PostID : '');
                callback();
            });
        });
    });
}

function SendNotification(OwnerID, SenderID, Type, Avatar, PostID)
{
    var Seen = 0;
    var Client = ClientList[OwnerID];

    if (typeof Client !== 'undefined' && Client !== null)
    {
        Seen = 1;
        Client.Socket.emit('Notification', { OwnerID: OwnerID, SenderID: SenderID, Type: Type, Avatar: Avatar, PostID: PostID });
    }

    DB.collection("notification").insertOne({ OwnerID: OwnerID, SenderID: SenderID, Type: Type, Seen: Seen, PostID: PostID, Time: Misc.Time });
}

module.exports.SendNotification = SendNotification;
module.exports.SendAllNotification = SendAllNotification;

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
