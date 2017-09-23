var UploadConfig = require('../Config/Upload');
var Request      = require('request');
var Async        = require('async');
var Misc         = require('../Handler/Misc');

var ServerList = [];
    ServerList[0] = { ID: 0, URL: UploadConfig.UPLOAD_SERVER_1 };
    ServerList[1] = { ID: 1, URL: UploadConfig.UPLOAD_SERVER_2 };

function ServerToken(ID)
{
    switch (ID)
    {
        case 0: return UploadConfig.UPLOAD_SERVER_1_TOKEN;
        case 1: return UploadConfig.UPLOAD_SERVER_2_TOKEN;
    }
}

function ServerURL(ID)
{
    if (typeof ServerList[ID] === 'undefined' || ServerList[ID] === null)
        return '';

    return ServerList[ID].URL;
}

function BestServerID()
{
    var Result = [];

    Async.eachSeries(ServerList, function(item, callback)
    {
        Request.post({ url: item.URL + "StorageSpace", form: { Password: ServerToken(item.ID) } }, function(error, httpResponse, body)
        {
            var Space = 0;

            try
            {
                Space = JSON.parse(body).Space;
            }
            catch (e)
            {
                Misc.FileLog('Upload-BestServerID: ' + body);
                Misc.FileLog('Upload-BestServerID: ' + e);
            }

            Result.push([ item.ID, Space ]);
            callback();
        });
    },
    function()
    {
        return Result.reduce(function(max, array) { return Math.max(max, array[0]); }, -Infinity);
    });
}

function DeleteFile(ID, URL)
{
    Request.post({ url: ServerURL(ID) + "DeleteFile", form: { Password: ServerToken(ID), Path: URL } }, function(error, httpResponse, body)
    {
        var Result = 1;

        try
        {
            Result = JSON.parse(body).Result;
        }
        catch (e)
        {
            Misc.FileLog('Upload-DeleteFile: ' + body);
            Misc.FileLog('Upload-DeleteFile: ' + e);
        }

        return Result;
    });
}

module.exports.BestServerID = BestServerID;
module.exports.DeleteFile = DeleteFile;
module.exports.ServerURL = ServerURL;
