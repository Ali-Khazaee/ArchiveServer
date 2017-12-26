const Misc = require('../Handler/Misc');

async function GetPrivate(ID, Owner)
{
    try
    {
        const Post = await DB.collection("post_private").findOne({ _id: MongoID(ID) }, { _id : 0 });
        const Account = await DB.collection("account").findOne({ _id: Post.Owner }, { Username: 1, Avatar: 1 });
        const Like = await DB.collection("post_private_like").findOne({ $and: [ { Owner: Account._id }, { Post: MongoID(ID) } ] });
        const Follow = await DB.collection("post_private_follow").findOne({ $and: [ { Following: Owner }, { Follower: Account._id } ] });
        const Bookmark = await DB.collection("post_private_bookmark").findOne({ $and: [ { Owner: Owner }, { Post: MongoID(ID) } ] });
        const LikeCount = await DB.collection("post_private_like").findOne({ _id: Post.Owner });
        const CommentCount = await DB.collection("post_private_like").findOne({ _id: Post.Owner });

        console.log(Post);
        console.log(Account);
        console.log(Like);




        return Post;
    }
    catch (e)
    {
        Misc.Log(e);
    }
}

function GetLikes(ID)
{

}

function GetComments(ID)
{

}

function IsFollow(ID)
{

}

function IsLike(ID)
{

}

function IsBookmark(ID)
{

}

module.exports.GetPrivate = GetPrivate;
