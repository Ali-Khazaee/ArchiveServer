var UploadConfig = require('../Config/Upload');
var Request      = require('request');
var Async        = require('async');
var Misc         = require('../Handler/Misc');

var ServerList = [ { ID: 0, URL: UploadConfig.UPLOAD_SERVER_1 }, { ID: 1, URL: UploadConfig.UPLOAD_SERVER_2 } ];

function ServerToken(ID)
{
    switch (ID)
    {
        case 0: return UploadConfig.UPLOAD_SERVER_1_TOKEN;
        case 1: return UploadConfig.UPLOAD_SERVER_2_TOKEN;
    }

    Misc.Log('Upload-ServerToken: Wrong ID ( ' + ID + ' )');
    return '';
}

function ServerURL(ID)
{
    if (typeof ServerList[ID] === 'undefined' || ServerList[ID] === null)
    {
        Misc.Log('Upload-ServerURL: Wrong ID ( ' + ID + ' )');
        return '';
    }

    return ServerList[ID].URL;
}

function BestServerID()
{
    var Result = [];

    return new Promise(function(resolve, reject)
    {

        Request.post({ url: ServerList[0].URL + "/StorageSpace", form: { Password: ServerToken(0) } }, function(error, httpResponse, body)
        {
            if (error)
            {
                Misc.Log('Upload-BestServerID: ' + error + " -- " + httpResponse + " -- " + body);
                reject();
            }

            var Space = 0;

            try
            {
                Space = JSON.parse(body).Space;
            }
            catch (e)
            {
                Misc.Log('Upload-BestServerID: ' + e + " -- " + error + " -- " + httpResponse + " -- " + body);
            }

            Result.push([ 0, Space ]);
            resolve();
        });
    })
    .then(function()
    {
        Request.post({ url: ServerList[1].URL + "/StorageSpace", form: { Password: ServerToken(1) } }, function(error, httpResponse, body)
        {
            if (error)
            {
                Misc.Log('Upload-BestServerID: ' + error + " -- " + httpResponse + " -- " + body);
                return;
            }

            var Space = 0;

            try
            {
                Space = JSON.parse(body).Space;
            }
            catch (e)
            {
                Misc.Log('Upload-BestServerID: ' + e + " -- " + error + " -- " + httpResponse + " -- " + body);
            }

            Result.push([ 1, Space ]);
            return;
        });
    })
    .then(function()
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
            Misc.Log('Upload-DeleteFile: ' + body);
            Misc.Log('Upload-DeleteFile: ' + e);
        }

        return Result;
    });
}

module.exports.ServerToken = ServerToken;
module.exports.BestServerID = BestServerID;
module.exports.DeleteFile = DeleteFile;
module.exports.ServerURL = ServerURL;
