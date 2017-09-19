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
            Misc.FileLog(error);
            return res.json({ Message: -1 });
        }

        DB.collection("post").count(function(error, PostCount)
        {
            if (error)
            {
                Misc.FileLog(error);
                return res.json({ Message: -1 });
            }

            DB.collection("post_comment").count(function(error, PostCommentCount)
            {
                if (error)
                {
                    Misc.FileLog(error);
                    return res.json({ Message: -1 });
                }

                DB.collection("post_like").count(function(error, PostLikeCount)
                {
                    if (error)
                    {
                        Misc.FileLog(error);
                        return res.json({ Message: -1 });
                    }

                    DB.collection("post_bookmark").count(function(error, PostBookmarkCount)
                    {
                        if (error)
                        {
                            Misc.FileLog(error);
                            return res.json({ Message: -1 });
                        }

                        DB.collection("report").count(function(error, ReportCount)
                        {
                            if (error)
                            {
                                Misc.FileLog(error);
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

module.exports = AdminRouter;
