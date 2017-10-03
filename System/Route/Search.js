var SearchRouter = require('express').Router();
var RateLimit    = require('../Handler/RateLimit');
var Upload       = require('../Handler/Upload');
var Async        = require('async');
var Auth         = require('../Handler/Auth');
var Misc         = require('../Handler/Misc');

SearchRouter.post('/SearchPeople', Auth(), RateLimit(120, 60), function(req, res)
{
    /*var Skip = req.body.Skip;
    var Username = req.body.Username;

    if (typeof Username === 'undefined' || Username === '')
        return res.json({ Message: 1 });

    if (typeof Skip === 'undefined' || Skip === '' || Skip === null)
        Skip = 0;

    Username = Username.toLowerCase();

    DB.collection("account").find({ Username: { $regex : Username } }, { _id: 1, Username: 1, Avatar: 1 }).limit(10).skip(Skip).toArray(function(error, result)
    {
        if (error)
        {
            Misc.Log(error);
            return res.json({ Message: -1 });
        }

        Async.eachSeries(result, function(item, callback)
        {
            DB.collection("account").findOne({ _id: item.SenderID }, { _id: 0, Username: 1, AvatarServer: 1, Avatar: 1 }, function(error1, result1)
            {
                if (error1)
                {
                    Misc.Log(error1);
                    return res.json({ Message: -1 });
                }

                if (result1 === null)
                    return callback();

                $PeopleList = $App->DB->Find('account', ['Username' => ['$regex' => $Name]], ['skip' => (isset($_POST["Skip"]) ? $_POST["Skip"] : 0), 'limit' => 10])->toArray();

                foreach ($PeopleList as $People)
                {
                    if (isset($People->AvatarServer))
                        $AvatarServerURL = Upload::GetServerURL($People->AvatarServer);
                    else
                        $AvatarServerURL = "";

                    $Follower = $App->DB->Command(["count" => "follow", "query" => ['Follower' => $People->_id]])->toArray()[0]->n;

                    if (!isset($Follower) || empty($Follower))
                        $Follower = 0;

                    array_push($Result, array("Username" => $People->Username,
                        "Avatar"   => isset($People->Avatar) ? $AvatarServerURL . $People->Avatar : "",
                        "Follower" => $Follower));
                }

                JSON(["Message" => 1000, "Result" => json_encode($Result)]);

                var Avatar = '';

                if (typeof result1.AvatarServer !== 'undefined' && result1.AvatarServer !== null && typeof result1.Avatar !== 'undefined' && result1.Avatar !== null)
                    Avatar = Upload.ServerURL(result1.AvatarServer) + result1.Avatar;

                SendNotification(item.OwnerID, item.SenderID, item.Type, Avatar, (item.PostID !== 'undefined') ? item.PostID : '');
                callback();
            });
        });
    });*/
});

SearchRouter.post('/FollowingList', Auth(), RateLimit(120, 60), function(req, res)
{
    var Skip = req.body.Skip;
    var Username = req.body.Username;

    if (typeof Username === 'undefined' || Username === '')
        return res.json({ Message: 1 });

    if (typeof Skip === 'undefined' || Skip === '' || Skip === null)
        Skip = 0;

    Username = Username.toLowerCase();

    DB.collection("account").findOne({ Username: Username }, { _id: 1 }, function(error, result)
    {
        if (error)
        {
            Misc.Log(error);
            return res.json({ Message: -1 });
        }

        if (result === null)
            return res.json({ Message: 2 });

        DB.collection("follow").find({ OwnerID: result._id }, { _id: 0, Follower: 1, Time: 1 }).limit(10).sort({ Time: -1 }).skip(Skip).toArray(function(error1, result1)
        {
            if (error1)
            {
                Misc.Log(error1);
                return res.json({ Message: -1 });
            }

            var Result = [];
            var OwnerID = res.locals.ID;

            Async.eachSeries(result1, function(item, callback)
                {
                    DB.collection("account").findOne({ _id: item.Follower }, { Username: 1, AvatarServer: 1, Avatar: 1 }, function(error2, result2)
                    {
                        if (error2)
                        {
                            Misc.Log(error2);
                            return res.json({ Message: -1 });
                        }

                        if (result2 === null)
                            return callback();

                        DB.collection("follow").findOne({ $and: [{ OwnerID: OwnerID, Follower: result2._id }] }, { _id: 1 }, function(error3, result3)
                        {
                            if (error3)
                            {
                                Misc.Log(error3);
                                return res.json({ Message: -1 });
                            }

                            var Avatar = '';
                            var IsFollow = result3 !== null;

                            if (typeof result2.AvatarServer !== 'undefined' && result2.AvatarServer !== null && typeof result2.Avatar !== 'undefined' && result2.Avatar !== null)
                                Avatar = Upload.ServerURL(result2.AvatarServer) + result2.Avatar;

                            Result.push({ Username: result2.Username, Avatar: Avatar, Time: item.Time, Follow: IsFollow });
                            callback();
                        });
                    });
                },
                function()
                {
                    res.json({ Message: 0, Result: Result });
                });
        });
    });
});

SearchRouter.post('/FollowersList', Auth(), RateLimit(120, 60), function(req, res)
{
    var Skip = req.body.Skip;
    var Username = req.body.Username;

    if (typeof Username === 'undefined' || Username === '')
        return res.json({ Message: 1 });

    if (typeof Skip === 'undefined' || Skip === '' || Skip === null)
        Skip = 0;

    Username = Username.toLowerCase();

    DB.collection("account").findOne({ Username: Username }, { _id: 1 }, function(error, result)
    {
        if (error)
        {
            Misc.Log(error);
            return res.json({ Message: -1 });
        }

        if (result === null)
            return res.json({ Message: 2 });

        DB.collection("follow").find({ Follower: result._id }, { _id: 0, OwnerID: 1, Time: 1 }).limit(10).sort({ Time: -1 }).skip(Skip).toArray(function(error1, result1)
        {
            if (error1)
            {
                Misc.Log(error1);
                return res.json({ Message: -1 });
            }

            var Result = [];
            var OwnerID = res.locals.ID;

            Async.eachSeries(result1, function(item, callback)
                {
                    DB.collection("account").findOne({ _id: item.OwnerID }, { Username: 1, AvatarServer: 1, Avatar: 1 }, function(error2, result2)
                    {
                        if (error2)
                        {
                            Misc.Log(error2);
                            return res.json({ Message: -1 });
                        }

                        if (result2 === null)
                            return callback();

                        DB.collection("follow").findOne({ $and: [{ OwnerID: OwnerID, Follower: result2._id }] }, { _id: 1 }, function(error3, result3)
                        {
                            if (error3)
                            {
                                Misc.Log(error3);
                                return res.json({ Message: -1 });
                            }

                            var Avatar = '';
                            var IsFollow = result3 !== null;

                            if (typeof result2.AvatarServer !== 'undefined' && result2.AvatarServer !== null && typeof result2.Avatar !== 'undefined' && result2.Avatar !== null)
                                Avatar = Upload.ServerURL(result2.AvatarServer) + result2.Avatar;

                            Result.push({ Username: result2.Username, Avatar: Avatar, Time: item.Time, Follow: IsFollow });
                            callback();
                        });
                    });
                },
                function()
                {
                    res.json({ Message: 0, Result: Result });
                });
        });
    });
});

module.exports = SearchRouter;
