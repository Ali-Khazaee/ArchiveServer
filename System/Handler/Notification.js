var Misc = require('../Handler/Misc');

function SendNotification(OwnerID, SenderID, Type, PostID)
{
    var Seen = 0;
    var Client = ClientList[OwnerID];

    if (typeof Client !== 'undefined' && Client !== null)
    {
        Seen = 1;
        Client.Socket.emit('Notification', { OwnerID: OwnerID, SenderID: SenderID, Type: Type, PostID: PostID });
    }

    DB.collection("notification").insertOne({ OwnerID: OwnerID, SenderID: SenderID, Type: Type, Seen: Seen, PostID: PostID, Time: Misc.Time });
}

module.exports.SendNotification = SendNotification;

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
