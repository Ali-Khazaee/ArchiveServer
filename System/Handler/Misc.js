var Winston = require('winston');

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

module.exports.Log = Log;
module.exports.FileLog = FileLog;
module.exports.IsValidEmail = isValidEmail;
module.exports.Time = Math.floor(Date.now() / 1000);
