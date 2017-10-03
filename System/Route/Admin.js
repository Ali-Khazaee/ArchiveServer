var AdminRouter = require('express').Router();
var RateLimit   = require('../Handler/RateLimit');
var Auth        = require('../Handler/Auth');
var Misc        = require('../Handler/Misc');

AdminRouter.post('/Admin/Status', Auth.AdminAuth(), RateLimit(10, 60), function(req, res)
{
    DB.collection("account").count(function(error, AccountCount)
    {
        if (error)
        {
            Misc.Log(error);
            return res.json({ Message: -1 });
        }

        DB.collection("post").count(function(error1, PostCount)
        {
            if (error1)
            {
                Misc.Log(error1);
                return res.json({ Message: -1 });
            }

            DB.collection("post_comment").count(function(error2, PostCommentCount)
            {
                if (error2)
                {
                    Misc.Log(error2);
                    return res.json({ Message: -1 });
                }

                DB.collection("post_like").count(function(error3, PostLikeCount)
                {
                    if (error3)
                    {
                        Misc.Log(error3);
                        return res.json({ Message: -1 });
                    }

                    DB.collection("post_bookmark").count(function(error4, PostBookmarkCount)
                    {
                        if (error4)
                        {
                            Misc.Log(error4);
                            return res.json({ Message: -1 });
                        }

                        DB.collection("report").count(function(error5, ReportCount)
                        {
                            if (error5)
                            {
                                Misc.Log(error5);
                                return res.json({ Message: -1 });
                            }

                            res.json({ Message: 0, Account: AccountCount, Post: PostCount, PostComment: PostCommentCount, PostLike: PostLikeCount, PostBookmark: PostBookmarkCount, Report: ReportCount  });
                        });
                    });
                });
            });
        });
    });
});

AdminRouter.post('/Admin/FindUserByID', Auth.AdminAuth(), RateLimit(10, 60), function(req, res)
{
    var ID = req.body.Username;

    if (typeof ID === 'undefined' || ID === '')
        return res.json({ Message: 1 });

    DB.collection("account").findOne({ _id: new MongoID(ID) }, function(error, result)
    {
        if (error)
        {
            Misc.Log(error);
            return res.json({ Message: -1 });
        }

        if (result === null)
            return res.json({ Message: 2 });

        res.json({ Message: 0, Result: result});
    });
});

AdminRouter.post('/Admin/FindUserByUsername', Auth.AdminAuth(), RateLimit(10, 60), function(req, res)
{
    var Username = req.body.Username;

    if (typeof Username === 'undefined' || Username === '')
        return res.json({ Message: 1 });

    DB.collection("account").findOne({ Username: Username }, function(error, result)
    {
        if (error)
        {
            Misc.Log(error);
            return res.json({ Message: -1 });
        }

        if (result === null)
            return res.json({ Message: 2 });

        res.json({ Message: 0, Result: result});
    });
});

AdminRouter.post('/Admin/FindPostByID', Auth.AdminAuth(), RateLimit(10, 60), function(req, res)
{
    var ID = req.body.ID;

    if (typeof ID === 'undefined' || ID === '')
        return res.json({ Message: 1 });

    DB.collection("post").findOne({ _id: new MongoID(ID) }, function(error, result)
    {
        if (error)
        {
            Misc.Log(error);
            return res.json({ Message: -1 });
        }

        if (result === null)
            return res.json({ Message: 2 });

        res.json({ Message: 0, Result: result});
    });
});

module.exports = AdminRouter;
