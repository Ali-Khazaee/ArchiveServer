var Misc = require('../Handler/Misc');

function SendNotification(OwnerID, SenderID, Type, Seen, PostID)
{
   DB.collection("notification").insertOne({ OwnerID: new MongoID(OwnerID), SenderID: new MongoID(SenderID), Type: Type, Seen: Seen, PostID: PostID, Time: Misc.Time });

    var Client = ClientList[OwnerID];

    if (typeof Client !== 'undefined' && Client !== null)
        Client.Socket.emit('Notification', { OwnerID: OwnerID, SenderID: SenderID, Type: Type, PostID: PostID });
}

module.exports.SendNotification = SendNotification;
