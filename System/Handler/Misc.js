const Winston = require('winston');
const NodeMailer = require('nodemailer');

Winston.add(Winston.transports.File, { filename: './System/Storage/Debug.log' });

function Log(Message)
{
    Winston.warn(Message);
}

const EmailPattern = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-?\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

function IsValidEmail(Email)
{
    if (Email === undefined || Email === '' || Email.length > 254)
        return true;

    if (!EmailPattern.test(Email))
        return true;

    const Parts = Email.split("@");

    if (Parts[0].length > 64)
        return true;

    return Parts[1].split(".").some(function(Part) { return Part.length > 63; });
}

function SendEmail(Email, Subject, Body)
{
    const Transporter = NodeMailer.createTransport({ host: 'mail.biogram.co', ignoreTLS: true, auth: { user: 'no-reply@biogram.co', pass: 'K01kTl45' } });
    const MailOptions = { from: '[Biogram] <no-reply@biogram.co>', to: Email, subject: Subject, html: Body };

    Transporter.sendMail(MailOptions, function(error, info)
    {
        if (error)
            Log("SendEmail: " + error + " -- " + info);
    });
}

function RandomString(Count)
{
    let Result = "";
    const Possible = "abcdefghijklmnopqrstuvwxyz";

    for (let I = 0; I < Count; I++)
        Result += Possible.charAt(Math.floor(Math.random() * Possible.length));

    return Result;
}

function RandomNumber(Count)
{
    let Result = "";
    const Possible = "0123456789";

    for (let I = 0; I < Count; I++)
        Result += Possible.charAt(Math.floor(Math.random() * Possible.length));

    return Result;
}

async function IsBlock(Owner, Target)
{
    const Block = await DB.collection("follow").find({ $and: [ { Owner: Owner }, { Target: Target } ] }).count();

    return Block !== 0;
}

function IsUndefined(Value)
{
    if (typeof Value === 'undefined' || Value === undefined || Value === null || Value == null)
        return true;

    if (typeof Value === 'object' && Value.constructor === MongoID)
        return false;

    if (typeof Value === 'object' && Value.constructor === Array && Value.length > 0)
        return false;

    if (typeof Value === 'object' && Value.constructor === Array && Value.length === 0)
        return true;

    if (typeof Value === 'string' && Value.length > 0)
        return false;

    if (typeof Value === 'string' && Value.length === 0)
        return true;

    if (Value.toString === Object.prototype.toString)
    {
        switch (Value.toString())
        {
            case '[object File]':
            case '[object Map]':
            case '[object Set]':
                return Value.size === 0;

            case '[object Object]':
            {
                for (let Key in Value)
                    if (Object.prototype.hasOwnProperty.call(Value, Key))
                        return false;

                return true;
            }
        }
    }

    return isNaN(Value);
}

module.exports.Log = Log;
module.exports.IsBlock = IsBlock;
module.exports.IsUndefined = IsUndefined;
module.exports.SendEmail = SendEmail;
module.exports.IsValidEmail = IsValidEmail;
module.exports.RandomString = RandomString;
module.exports.RandomNumber = RandomNumber;
module.exports.Time = function() { return Math.floor(Date.now() / 1000); };
