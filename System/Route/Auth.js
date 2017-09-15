var AuthRouter = require('express').Router();
var RateLimit  = require('../Handler/RateLimit');
var BCrypt     = require('bcrypt');
var JWT        = require('jsonwebtoken');
var Misc       = require('../Handler/Misc');
var AuthConfig = require('../Config/Auth');

AuthRouter.post('/UsernameIsAvailable', RateLimit(60, 60), function(req, res)
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

AuthRouter.post('/SignUp', RateLimit(30, 60), function(req, res)
{
    var Username = req.body.Username;
    var Password = req.body.Password;
    var Session = req.body.Session;
    var Email = req.body.Email;

    if (typeof Username === 'undefined' || Username === '')
        return res.json({ Message: 1 });

    if (Username.length < 3)
        return res.json({ Message: 2 });

    if (Username.length > 32)
        return res.json({ Message: 3 });

    Username = Username.toLowerCase();

    if (Username.search(/^(?![^a-z])(?!.*([_.])\1)[\w.]*[a-z]$/) === -1)
        return res.json({ Message: 4 });

    if (typeof Password === 'undefined' || Password === '')
        return res.json({ Message: 5 });

    if (Password.length < 5)
        return res.json({ Message: 6 });

    if (Password.length > 32)
        return res.json({ Message: 7 });

    Password = Password.toLowerCase();

    if (typeof Email === 'undefined' || Email === '')
        return res.json({ Message: 8 });

    Email = Email.toLowerCase();

    if (Misc.IsValidEmail(Email))
        return res.json({ Message: 9 });

    DB.collection("account").findOne({ Username: Username }, function(error, result)
    {
        if (error)
        {
            Misc.FileLog(error);
            return res.json({ Message: -1 });
        }

        if (result !== null)
            return res.json({ Message: 11 });

        var IP = req.connection.remoteAddress;

        if (typeof Session === 'undefined' || Session === '')
            Session = "Unknown Session - " + IP;
        else
            Session = Session + " - " + IP;

        BCrypt.hash(Password, 8, function(error1, Hash)
        {
            if (error1)
            {
                Misc.FileLog(error1);
                return res.json({ Message: -3 });
            }

            var Time = Misc.Time;

            DB.collection("account").insertOne({ Username: Username, Password: Hash, Email: Email, CreatedTime: Time, LastOnline: Time }, function(error2, result1)
            {
                if (error2)
                {
                    Misc.FileLog(error2);
                    return res.json({ Message: -1 });
                }

                JWT.sign({ ID: result1.insertedId, exp : Time + 31536000 }, AuthConfig.PRIVATE_KEY, function(error3, token)
                {
                    if (error3)
                    {
                        Misc.FileLog(error3);
                        return res.json({ Message: -4 });
                    }

                    DB.collection("account").updateOne({ _id: result1.insertedId }, { $push: { Session: { Name: Session, Token: token, CreatedTime: Time } } });

                    res.json({ Message: 0, TOKEN: token, ID: result1.insertedId, USERNAME: Username });
                });
            });
        });
    });
});

// nodeGeneratedHash.replace('$2a$', '$2y$');
// bcrypt.compare(myPlaintextPassword, hash, function(err, res) {    // res == true });

module.exports = AuthRouter;
