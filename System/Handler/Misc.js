var Winston = require('winston');
var NodeMailer = require('nodemailer');

Winston.add(Winston.transports.File, { filename: './System/Storage/Debug.log' });

function Log(Message)
{
    console.log(Message)
}

function FileLog(Message)
{
    Winston.warn(Message);
}

var EmailPattern = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-?\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

function isValidEmail(Email)
{
    if (!Email || Email.length > 254)
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
    var Transporter = NodeMailer.createTransport({ service: 'mail.biogram.co', auth: { user: 'no-reply@biogram.co', pass: 'K01kTl45' } });
    var MailOptions = { from: 'no-reply@biogram.co', to: Email, subject: Subject, html: Body };

    Transporter.sendMail(MailOptions, function(error, info)
    {
        if (error)
            FileLog(error);
        else
            Log('Email Sent: ' + info.response);
    });
}

function randomString(Count)
{
    var Result = "";
    var Possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var I = 0; I < Count; I++)
        Result += Possible.charAt(Math.floor(Math.random() * Possible.length));

    return Result;
}

module.exports.Log = Log;
module.exports.FileLog = FileLog;
module.exports.IsValidEmail = isValidEmail;
module.exports.Time = Math.floor(Date.now() / 1000);
module.exports.SendEmail = SendEmail;
module.exports.RandomString = randomString;
