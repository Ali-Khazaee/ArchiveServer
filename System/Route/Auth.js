var AuthRouter = require('express').Router();
var RateLimit  = require('../Handler/RateLimit');
var CoreConfig = require('../Config/Core');
var Upload     = require('../Handler/Upload');
var BCrypt     = require('bcrypt');
var Auth       = require('../Handler/Auth');
var Misc       = require('../Handler/Misc');

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

    if (Username.search(CoreConfig.USERNAME_PATTERN) === -1)
        return res.json({ Message: 4 });

    DB.collection("account").findOne({ Username: Username }, { _id: 1 }, function(error, result)
    {
        if (error)
        {
            Misc.Log(error);
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

    if (Username.search(CoreConfig.USERNAME_PATTERN) === -1)
        return res.json({ Message: 4 });

    if (typeof Password === 'undefined' || Password === '')
        return res.json({ Message: 5 });

    if (Password.length < 3)
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
            Misc.Log(error);
            return res.json({ Message: -1 });
        }

        if (result !== null)
            return res.json({ Message: 10 });

        var IP = req.connection.remoteAddress;

        if (typeof Session === 'undefined' || Session === '')
            Session = "Unknown Session - " + IP;
        else
            Session = Session + " - " + IP;

        BCrypt.hash(Password, 8, function(error1, result1)
        {
            if (error1)
            {
                Misc.Log(error1);
                return res.json({ Message: -3 });
            }

            var Time = Misc.Time;

            DB.collection("account").insertOne({ Username: Username, Password: result1, Email: Email, CreatedTime: Time, LastOnline: Time }, function(error2, result2)
            {
                if (error2)
                {
                    Misc.Log(error2);
                    return res.json({ Message: -1 });
                }

                var Token = Auth.CreateToken(result2.insertedId);

                DB.collection("account").updateOne({ _id: result2.insertedId }, { $push: { Session: { Name: Session, Token: Token, CreatedTime: Time } } });

                res.json({ Message: 0, TOKEN: Token, ID: result2.insertedId, USERNAME: Username });
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

    if (Username.search(CoreConfig.USERNAME_PATTERN) === -1)
        return res.json({ Message: 4 });

    if (typeof Password === 'undefined' || Password === '')
        return res.json({ Message: 5 });

    if (Password.length < 3)
        return res.json({ Message: 6 });

    if (Password.length > 32)
        return res.json({ Message: 7 });

    Password = Password.toLowerCase();

    DB.collection("account").findOne({ Username: Username }, { _id: 1, Password: 1 }, function(error, result)
    {
        if (error)
        {
            Misc.Log(error);
            return res.json({ Message: -1 });
        }

        if (result === null)
            return res.json({ Message: 8 });

        var Hash = result.Password.replace('$2y$', '$2a$');

        BCrypt.compare(Password, Hash, function(error1, result1)
        {
            if (error1)
            {
                Misc.Log(error1);
                return res.json({ Message: -3 });
            }

            if (result1 === false)
                return res.json({ Message: 9 });

            var IP = req.connection.remoteAddress;
            var Token = Auth.CreateToken(result._id);

            if (typeof Session === 'undefined' || Session === '')
                Session = "Unknown Session - " + IP;
            else
                Session = Session + " - " + IP;

            DB.collection("account").updateOne({ _id: result._id }, { $push: { Session: { Name: Session, Token: Token, CreatedTime: Misc.Time } } });

            res.json({ Message: 0, TOKEN: Token, ID: result._id, USERNAME: Username });
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
        if (EmailOrUsername.search(CoreConfig.USERNAME_PATTERN) === -1)
            return res.json({ Message: 2 });

        DB.collection("account").findOne({ Username: EmailOrUsername }, { _id: 1, Email: 1 }, function(error, result)
        {
            if (error)
            {
                Misc.Log(error);
                return res.json({ Message: -1 });
            }

            if (result === null)
                return res.json({ Message: 3 });

            var RandomString = Misc.RandomString(25);

            DB.collection("recovery_password").insertOne({ ID: result._id, Username: EmailOrUsername, Email: result.Email, Key: RandomString, CreatedTime: Misc.Time });

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
                Misc.Log(error);
                return res.json({ Message: -1 });
            }

            if (result === null)
                return res.json({ Message: 3 });

            var RandomString = Misc.RandomString(25);

            DB.collection("recovery_password").insertOne({ ID: result._id, Username: result.Username, Email: EmailOrUsername, Key: RandomString, CreatedTime: Misc.Time });

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

AuthRouter.post('/ChangePassword', Auth(), RateLimit(30, 60), function(req, res)
{
    var PasswordOld = req.body.PasswordOld;
    var PasswordNew = req.body.PasswordNew;

    if (typeof PasswordOld === 'undefined' || PasswordOld === '')
        return res.json({ Message: 1 });

    if (PasswordOld.length < 3)
        return res.json({ Message: 2 });

    if (PasswordOld.length > 32)
        return res.json({ Message: 3 });

    PasswordOld = PasswordOld.toLowerCase();

    if (typeof PasswordNew === 'undefined' || PasswordNew === '')
        return res.json({ Message: 4 });

    if (PasswordNew.length < 3)
        return res.json({ Message: 5 });

    if (PasswordNew.length > 32)
        return res.json({ Message: 6 });

    PasswordNew = PasswordNew.toLowerCase();

    DB.collection("account").findOne({ _id: res.locals.ID }, { _id: 0, Password: 1 }, function(error, result)
    {
        if (error)
        {
            Misc.Log(error);
            return res.json({ Message: -1 });
        }

        if (result === null)
            return res.json({ Message: 7 });

        var Hash = result.Password.replace('$2y$', '$2a$');

        BCrypt.compare(PasswordOld, Hash, function(error1, result1)
        {
            if (error1)
            {
                Misc.Log(error1);
                return res.json({ Message: -3 });
            }

            if (result1 === false)
                return res.json({ Message: 8 });

            BCrypt.hash(PasswordNew, 8, function(error2, result2)
            {
                if (error2)
                {
                    Misc.Log(error2);
                    return res.json({ Message: -3 });
                }

                DB.collection("account").updateOne({ _id: res.locals.ID }, { $set: { Password: result2 } });

                res.json({ Message: 0 });
            });
        });
    });
});

AuthRouter.post('/SignInGoogle', Auth(), RateLimit(30, 60), function(req, res)
{
    var Token = req.body.Token;
    var Session = req.body.Session;

    if (typeof Token === 'undefined' || Token === '')
        return res.json({ Message: 1 });

    var GoogleAuth = new require('google-auth-library');
    var Client = new GoogleAuth.OAuth2('590625045379-pnhlgdqpr5i8ma705ej7akcggsr08vdf.apps.googleusercontent.com', '', '');

    Client.verifyIdToken(Token, '590625045379-pnhlgdqpr5i8ma705ej7akcggsr08vdf.apps.googleusercontent.com', function(error, result)
    {
        if (error)
        {
            Misc.Log(error);
            return res.json({ Message: 2 });
        }

        var PayLoad = result.getPayload();

        if (typeof PayLoad === 'undefined' || PayLoad === null || PayLoad === '')
            return res.json({ Message: 3 });

        if (PayLoad['iss'] !== "accounts.google.com" && PayLoad['iss'] !== "https://accounts.google.com")
            return res.json({ Message: 4 });

        if (PayLoad['aud'] !== '590625045379-pnhlgdqpr5i8ma705ej7akcggsr08vdf.apps.googleusercontent.com')
            return res.json({ Message: 5 });

        var IP = req.connection.remoteAddress;

        if (typeof Session === 'undefined' || Session === '')
            Session = "Unknown Session - " + IP;
        else
            Session = Session + " - " + IP;

        DB.collection("account").findOne({ GoogleID: PayLoad['sub'] }, { Username: 1, AvatarServer: 1, Avatar: 1 }, function(error1, result1)
        {
            if (error1)
            {
                Misc.Log(error1);
                return res.json({ Message: -1 });
            }

            if (result1 !== null)
            {
                var Avatar = '';
                var Token = Auth.CreateToken(result1._id);

                if (typeof result1.AvatarServer !== 'undefined' && result1.AvatarServer !== null && typeof result1.Avatar !== 'undefined' && result1.Avatar !== null)
                    Avatar = Upload.ServerURL(result1.AvatarServer) + result1.Avatar;

                DB.collection("account").updateOne({ _id: result1._id }, { $push: { Session: { Name: Session, Token: Token, CreatedTime: Misc.Time } } });

                res.json({ Message: 0, TOKEN: Token, ID: result1._id, USERNAME: result1.Username, Avatar: Avatar });
            }
            else
            {
                var Time = Misc.Time;
                var Username = PayLoad['email'].split("@")[0].substr(0, 12);
                Username = Username + Time.substr(-4, 4) + Misc.RandomString(3);

                DB.collection("account").insertOne({ GoogleID: PayLoad['sub'], Username: Username, Email: PayLoad['email'], CreatedTime: Time, LastOnline: Time }, function(error2, result2)
                {
                    if (error2)
                    {
                        Misc.Log(error2);
                        return res.json({ Message: -1 });
                    }

                    var Token = Auth.CreateToken(result2.insertedId);

                    DB.collection("account").updateOne({ _id: result2.insertedId }, { $push: { Session: { Name: Session, Token: Token, CreatedTime: Time } } });

                    res.json({ Message: 0, TOKEN: Token, ID: result2.insertedId, USERNAME: Username });
                });
            }
        });
    });
});

AuthRouter.get('/RecoveryPassword/:Key', RateLimit(30, 60), function(req, res)
{
    var Key = req.params.Key;

    if (typeof Key === 'undefined' || Token === '')
        return res.json({ Message: 1 });

    DB.collection("recovery_password").findOne({ Key: Key }, { _id: 0, ID: 1, Username: 1, Email: 1, Key: 1 }, function(error, result)
    {
        if (error)
        {
            Misc.Log(error);
            return res.json({ Message: -1 });
        }

        if (result === null)
            return res.json({ Message: 2 });

        if (result.Key !== Key)
            return res.json({ Message: 3 });

        var Password = Misc.RandomString(5);

        BCrypt.hash(Password, 8, function(error1, result1)
        {
            if (error1)
            {
                Misc.Log(error1);
                return res.json({ Message: -3 });
            }

            DB.collection("account").updateOne({ _id: result.ID }, { $set: { Password: result1 } });

            var To = result.Username + " <" + result.Email + ">";
            var Subject = "[Biogram] your new password"; // TODO Reset Text
            var Body = "<p>We heard that you lost your GitHub password. Sorry about that!</p>" +
                "<p>But don't worry! You can use the following link within the 3 hours to reset your password:</p>" +
                "Password: " + Password +
                "If you don't use this link within 3 hours, it will expire" +
                "Thanks," +
                "Your friends at Biogram";

            Misc.SendEmail(To, Subject, Body);

            res.json({ Message: 0 });
        });
    });
});

module.exports = AuthRouter;
