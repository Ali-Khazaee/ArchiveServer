var Winston = require('winston');
var NodeMailer = require('nodemailer');

Winston.add(Winston.transports.File, { filename: './System/Storage/Debug.log' });

function Log(Message)
{
    Winston.warn(Message);
}

var EmailPattern = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-?\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

function IsValidEmail(Email)
{
    if (typeof Email === 'undefined' || Email === '' || Email.length > 254)
        return true;

    if (!EmailPattern.test(Email))
        return true;

    var Parts = Email.split("@");

    if (Parts[0].length > 64)
        return true;

    return Parts[1].split(".").some(function(Part) { return Part.length > 63; });
}

function SendEmail(Email, Subject, Body)
{
    var Transporter = NodeMailer.createTransport({ host: 'mail.biogram.co', ignoreTLS: true, auth: { user: 'no-reply@biogram.co', pass: 'K01kTl45' } });
    var MailOptions = { from: '[Biogram] <no-reply@biogram.co>', to: Email, subject: Subject, html: Body };

    Transporter.sendMail(MailOptions, function(error, info)
    {
        if (error)
            Log(error);
    });
}

function RandomString(Count)
{
    var Result = "";
    var Possible = "abcdefghijklmnopqrstuvwxyz";

    for (var I = 0; I < Count; I++)
        Result += Possible.charAt(Math.floor(Math.random() * Possible.length));

    return Result;
}

module.exports.Log = Log;
module.exports.SendEmail = SendEmail;
module.exports.IsValidEmail = IsValidEmail;
module.exports.RandomString = RandomString;

module.exports.Time = Math.floor(Date.now() / 1000);
