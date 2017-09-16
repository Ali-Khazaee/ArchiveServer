var Crypto        = require('crypto');
var Misc          = require('./Misc');
var AuthConfig    = require('../Config/Auth');
var StringTrim    = require('locutus/php/strings/strtr');
var StringReplace = require('locutus/php/strings/str_replace');

function Verify(Token)
{
    var Signature = Token.split('.')[1];
    var Remainder = Signature.length % 4;

    if (Remainder)
    {
        var PadLength = 4 - Remainder;

        var Y = '';
        var Input = '=';

        while (true)
        {
            if (PadLength && 1)
                Y += Input;

            PadLength >>= 1;

            if (PadLength)
                Input += Input;
            else
                break;
        }

        Signature += Y;
    }

    Signature = Buffer.from(StringTrim(Signature, '-_', '+/'), 'base64');

    var Verifier = Crypto.createVerify('sha256');
    Verifier.update(Token.split('.')[0]);

    return Verifier.verify(AuthConfig.PUBLIC_KEY, Signature, 'base64');
}

function Base64Encode(Message)
{
    return StringReplace('=', '', StringTrim(Buffer.from(Message), 'base64'), '+/', '-_'));
}

function CreateToken(ID)
{
    var Segment = Base64Encode(JSON.stringify({ ID: ID, exp : Misc.Time + 15768000 }));

    var Signer = Crypto.createSign('sha256');
    Signer.update(Segment);

    return Segment + "." + Signer.sign(AuthConfig.PRIVATE_KEY, 'base64');
}

function Auth()
{
    return function(req, res, next)
    {
        var Token = req.headers['token'];

        if (typeof Token === 'undefined' || Token === '' || Token.split('.').length < 1)
            return res.json({ Message: -4 });

        DB.collection("token").findOne({ TOKEN: Token }, { _id: 1 }, function(error, result)
        {
            if (error)
            {
                Misc.FileLog(error);
                return res.json({ Message: -1 });
            }

            if (result !== null)
                return res.json({ Message: -4 });

            JWT.verify(Token, AuthConfig.PUBLIC_KEY, { algorithms: ['SHA256'] }, function(error1, result1)
            {
                if (error1)
                {
                    Misc.FileLog(error1);
                    return res.json({ Message: -4 });
                }

                if (typeof result1 === 'undefined' || result1 === '')
                    return res.json({ Message: -4 });

                console.log(result1);

                next();
            });
        });
    }
}

module.exports = Auth;
module.exports.CreateToken = CreateToken;
