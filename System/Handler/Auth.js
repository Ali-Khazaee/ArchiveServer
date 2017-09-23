var Crypto        = require('crypto');
var Misc          = require('./Misc');
var AuthConfig    = require('../Config/Auth');
var StringTrim    = require('locutus/php/strings/strtr');
var StringReplace = require('locutus/php/strings/str_replace');

function Auth()
{
    return function(req, res, next)
    {
        var Token = req.headers.token;

        if (typeof Token === 'undefined' || Token === '' || Token.split('.').length !== 2)
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

            if (!Verifier.verify(AuthConfig.PUBLIC_KEY, Signature, 'base64'))
                return res.json({ Message: -4 });

            res.locals.ID = new MongoID(JSON.parse(new Buffer(Token.split('.')[0], 'base64').toString('ascii')).ID);

            next();
        });
    };
}

function AdminAuth()
{
    return function(req, res, next)
    {
        var Session = req.body.Session;

        if (typeof Session === 'undefined' || Session === '' || Session !== AuthConfig.ADMIN_SESSION)
            return res.json({ Message: -5 });

        next();
    };
}

function CreateToken(ID)
{
    var Segment = StringReplace('=', '', StringTrim(Buffer.from(JSON.stringify({ ID: ID, exp : Misc.Time + 15768000 }).toString()).toString('base64'), '+/', '-_'));

    var Signer = Crypto.createSign('sha256');
    Signer.update(Segment);

    return Segment + "." + Signer.sign(AuthConfig.PRIVATE_KEY, 'base64');
}

module.exports = Auth;
module.exports.AdminAuth = AdminAuth;
module.exports.CreateToken = CreateToken;
