const Misc          = require('./Misc');
const StringReplace = require('locutus/php/strings/str_replace');

const DeliveryType =
{
    Sent: 0,
    Delivered: 1,
    Seen: 2
};

async function SendMessage(From, Receiver, Message, ReplyToMessageID)
{
    if (Message.length < 1 || Message.length > 1024 || Receiver.length !== 24)
        return;

    Message = StringReplace('  ', ' ', Message);

    let receiver = await DB.collection('account').findOne({ _id: new MongoID(Receiver) });
    console.log(receiver);

    return;

    if (From.ID !== Receiver)
    {
        for (let SockID in ClientList)
        {
            if (ClientList[SockID].ID.toString() === Receiver)
            {
                Misc.Log('Message Emmited');
                ClientList[SockID].Socket.emit('Message', { Sender: From, Message: Message, ReplyToMessageID: ReplyToMessageID });
            }
        }
    }

    await DB.collection('chat').insertOne({ Sender: From, Receiver: new MongoID(Receiver), Message: Message, ReplyToMessageID: ReplyToMessageID, Status: DeliveryType.Sent, Date: Date.now() }, );
}

function IsTyping(From, Receiver)
{
    for (let SockID in ClientList)
    {
        if (ClientList[SockID].ID === Receiver)
        {
            ClientList[SockID].Socket.emit('IsTyping', { Sender: From });
        }
    }
}

module.exports =
{
    SendMessage,
    IsTyping
};