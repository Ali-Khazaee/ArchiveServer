var MiscRouter = require('express').Router();
var NodeMailer = require('nodemailer');
var RateLimit  = require('../Handler/RateLimit');
var Auth       = require('../Handler/Auth');
var Misc       = require('../Handler/Misc');

MiscRouter.post('/Crash', Auth(), RateLimit(30, 60), function(req, res)
{
    var Crash = req.body.Crash;

    if (typeof Crash === 'undefined' || Crash === '')
        return res.json({ Message: 1 });

    DB.collection("crash").insertOne({ Crash: Crash, Time: Misc.Time() });

    var Transporter = NodeMailer.createTransport(
    {
        service: "Gmail",
        auth:
        {
            user: 'ali.khazaee.mighty@gmail.com',
            pass: 'vcbhjsxvarbjicwi'
        }
    });

    var MailOptions = { from: 'Biogram Crash ' + Misc.Time() + ' <crash@biogram.co>', to: 'dev.khazaee@gmail.com', subject: 'Biogram -- Crash -- ' + Misc.Time(), text: Crash };

    Transporter.sendMail(MailOptions, function(error)
    {
        if (error)
            Misc.Log(error);
    });

    res.json({ Message: 0 });
});

MiscRouter.post('/Update', function(req, res)
{
    res.json({ Message: 0, VersionCode: 8 });
});

module.exports = MiscRouter;
