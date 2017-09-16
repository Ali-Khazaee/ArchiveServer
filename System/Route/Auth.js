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

    DB.collection("account").findOne({ Username: Username }, { _id: 1 }, function(error, result)
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

    DB.collection("account").findOne({ Username: Username }, { _id: 1 }, function(error, result)
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

        BCrypt.hash(Password, 8, function(error1, result1)
        {
            if (error1)
            {
                Misc.FileLog(error1);
                return res.json({ Message: -3 });
            }

            var Time = Misc.Time;

            DB.collection("account").insertOne({ Username: Username, Password: result1, Email: Email, CreatedTime: Time, LastOnline: Time }, function(error2, result2)
            {
                if (error2)
                {
                    Misc.FileLog(error2);
                    return res.json({ Message: -1 });
                }

                JWT.sign({ ID: result2.insertedId, exp : Time + 31536000 }, AuthConfig.PRIVATE_KEY, function(error3, result3)
                {
                    if (error3)
                    {
                        Misc.FileLog(error3);
                        return res.json({ Message: -4 });
                    }

                    DB.collection("account").updateOne({ _id: result2.insertedId }, { $push: { Session: { Name: Session, Token: result3, CreatedTime: Time } } });

                    res.json({ Message: 0, TOKEN: result3, ID: result2.insertedId, USERNAME: Username });
                });
            });
        });
    });
});

AuthRouter.post('/SignIn', RateLimit(30, 60), function(req, res)
{
    var Username = req.body.Username;
    var Password = req.body.Password;
    var Session = req.body.Session;

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

    DB.collection("account").findOne({ Username: Username }, { _id: 1, Password: 1 }, function(error, result)
    {
        if (error)
        {
            Misc.FileLog(error);
            return res.json({ Message: -1 });
        }

        if (result === null)
            return res.json({ Message: 8 });

        var Hash = result.Password.replace('$2y$', '$2a$');

        BCrypt.compare(Password, Hash, function(error1, result1)
        {
            if (error1)
            {
                Misc.FileLog(error1);
                return res.json({ Message: -3 });
            }

            if (result1 === false)
                return res.json({ Message: 9 });

            var Time = Misc.Time;

            JWT.sign({ ID: result._id, exp : Time + 31536000 }, AuthConfig.PRIVATE_KEY, function(error2, result2)
            {
                if (error2)
                {
                    Misc.FileLog(error2);
                    return res.json({ Message: -4 });
                }

                var IP = req.connection.remoteAddress;

                if (typeof Session === 'undefined' || Session === '')
                    Session = "Unknown Session - " + IP;
                else
                    Session = Session + " - " + IP;

                DB.collection("account").updateOne({ _id: new MongoID(result._id) }, { $push: { Session: { Name: Session, Token: result2, CreatedTime: Time } } });

                res.json({ Message: 0, TOKEN: result2, ID: result._id, USERNAME: Username });
            });
        });
    });
});

AuthRouter.post('/ResetPassword', RateLimit(30, 60), function(req, res)
{
    var EmailOrUsername = req.body.EmailOrUsername;

    if (typeof EmailOrUsername === 'undefined' || EmailOrUsername === '')
        return res.json({ Message: 1 });

    EmailOrUsername = EmailOrUsername.toLowerCase();

    if (Misc.IsValidEmail(EmailOrUsername))
    {
        if (EmailOrUsername.search(/^(?![^a-z])(?!.*([_.])\1)[\w.]*[a-z]$/) === -1)
            return res.json({ Message: 2 });

        DB.collection("account").findOne({ Username: EmailOrUsername }, { _id: 1, Email: 1 }, function(error, result)
        {
            if (error)
            {
                Misc.FileLog(error);
                return res.json({ Message: -1 });
            }

            if (result === null)
                return res.json({ Message: 3 });

            var RandomString = Misc.RandomString(25);

            DB.collection("recovery_password").insertOne({ ID: result._id, Data: EmailOrUsername, Key: RandomString, CreatedTime: Misc.Time });

            var URL = "http://recovery.biogram.co/RecoveryPassword/" + RandomString;
            var To = EmailOrUsername + " <" + result.Email + ">";
            var Subject = "[Biogram] Please reset your password";
            var Body = "<p>We heard that you lost your GitHub password. Sorry about that!</p>" +
                       "<p>But don't worry! You can use the following link within the 3 hours to reset your password:</p>" +
                       "<a href='" + URL + "'>" + URL + "</a>" +
                       "If you don't use this link within 3 hours, it will expire" +
                       "Thanks," +
                       "Your friends at Biogram";

            Misc.SendEmail(To, Subject, Body);

            res.json({ Message: 0 });
        });
    }
    else
    {
        DB.collection("account").findOne({ Email: EmailOrUsername }, { _id: 1, Username: 1 }, function(error, result)
        {
            if (error)
            {
                Misc.FileLog(error);
                return res.json({ Message: -1 });
            }

            if (result === null)
                return res.json({ Message: 3 });

            DB.collection("recovery_password").insertOne({ ID: result._id, Data: EmailOrUsername, Key: RandomString, CreatedTime: Misc.Time });

            var URL = "http://recovery.biogram.co/RecoveryPassword/" + RandomString;
            var To = result.Username + " <" + EmailOrUsername + ">";
            var Subject = "[Biogram] Please reset your password";
            var Body = "<p>We heard that you lost your GitHub password. Sorry about that!</p>" +
                "<p>But don't worry! You can use the following link within the 3 hours to reset your password:</p>" +
                "<a href='" + URL + "'>" + URL + "</a>" +
                "If you don't use this link within 3 hours, it will expire" +
                "Thanks," +
                "Your friends at Biogram";

            Misc.SendEmail(To, Subject, Body);

            res.json({ Message: 0 });
        });
    }
});

module.exports = AuthRouter;
