const Crypto        = require('crypto');
const Misc          = require('./Misc');
const AuthConfig    = require('../Config/Auth');
const StringTrim    = require('locutus/php/strings/strtr');
const StringReplace = require('locutus/php/strings/str_replace');

function Auth()
{
    return function(req, res, next)
    {
        const Token = req.headers.token;
        const Split = Token.split('.');

        if (typeof Token === 'undefined' || Token === '' || Split.length !== 2)
            return res.json({ Message: -4 });

        DB.collection("token").findOne({ Token: Token }, { _id: 1 }, function(error, result)
        {
            if (error)
            {
                Misc.Log(error);
                return res.json({ Message: -1 });
            }

            if (result !== null)
                return res.json({ Message: -4 });

            const Data = Split[0];
            let Signature = Split[1];
            const Remainder = Signature.length % 4;

            if (Remainder)
            {
                let PadLength = 4 - Remainder;

                let Y = '';
                let Input = '=';

                while (true)
                {
                    if (PadLength)
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

            let Verifier = Crypto.createVerify('sha256');
            Verifier.update(Data);

            if (!Verifier.verify(AuthConfig.PUBLIC_KEY, Signature, 'base64'))
                return res.json({ Message: -4 });

            res.locals.ID = MongoID(JSON.parse(new Buffer(Split, 'base64').toString('ascii')).ID);

            next();
        });
    };
}

function AdminAuth()
{
    return function(req, res, next)
    {
        let Session = req.body.Session;

        if (typeof Session === 'undefined' || Session === '' || Session !== AuthConfig.ADMIN_SESSION)
            return res.json({ Message: -5 });

        next();
    };
}

function CreateToken(ID)
{
    let Segment = StringReplace('=', '', StringTrim(Buffer.from(JSON.stringify({ ID: ID, Time : Misc.Time }).toString()).toString('base64'), '+/', '-_'));

    let Signer = Crypto.createSign('sha256');
    Signer.update(Segment);

    return Segment + "." + Signer.sign(AuthConfig.PRIVATE_KEY, 'base64');
}

function VerifyToken(Token)
{
    if (typeof Token === 'undefined' || Token === '' || Token.split('.').length !== 2)
        return null;

    let Signature = Token.split('.')[1];
    let Remainder = Signature.length % 4;

    if (Remainder)
    {
        let PadLength = 4 - Remainder;

        let Y = '';
        let Input = '=';

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

    let Verifier = Crypto.createVerify('sha256');
    Verifier.update(Token.split('.')[0]);

    if (!Verifier.verify(AuthConfig.PUBLIC_KEY, Signature, 'base64'))
        return null;

    return new MongoID(JSON.parse(new Buffer(Token.split('.')[0], 'base64').toString('ascii')).ID);
}

module.exports = Auth;
module.exports.AdminAuth = AdminAuth;
module.exports.CreateToken = CreateToken;
module.exports.VerifyToken = VerifyToken;