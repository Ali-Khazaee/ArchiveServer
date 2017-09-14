var AuthRouter = require('express').Router();
var RateLimit = require('../Handler/RateLimit');
var Misc       = require('../Handler/Misc');

AuthRouter.post('/UsernameIsAvailable', RateLimit(2, 60), function(req, res)
{
    var Username = req.body.Username;

    if (typeof Username === 'undefined' || Username === '')
        return res.json({ Message: 1 });

    if (Username.length < 3)
        return res.json({ Message: 2 });

    if (Username.length > 32)
        return res.json({ Message: 3 });

    Username = Username.toLowerCase();

    if (Username.search(/^(?![^a-z])(?!.*([_.])\1)[\w.]*[a-z]$/) === -1)
        return res.json({ Message: 4 });

    DB.collection("account").findOne({ Username: Username }, function(error, result)
    {
        if (error)
        {
            Misc.FileLog(error);
            return res.json({ Message: -1 });
        }

        if (result !== null)
            return res.json({ Message: 5 });

        res.json({ Message: 0 });
    });
});

AuthRouter.post('/SignUp', RateLimit(2, 60), function(req, res)
{
    var Username = req.body.Username;

    if (typeof Username === 'undefined' || Username === '')
        return res.json({ Message: 1 });

    if (Username.length < 3)
        return res.json({ Message: 2 });

    if (Username.length > 32)
        return res.json({ Message: 3 });

    Username = Username.toLowerCase();

    if (Username.search(/^(?![^a-z])(?!.*([_.])\1)[\w.]*[a-z]$/) === -1)
        return res.json({ Message: 4 });

    DB.collection("account").findOne({ Username: Username }, function(error, result)
    {
        if (error)
        {
            Misc.FileLog(error);
            return res.json({ Message: -1 });
        }

        if (result !== null)
            return res.json({ Message: 5 });

        res.json({ Message: 0 });
    });
});

module.exports = AuthRouter;
