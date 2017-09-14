var MongoClient = require('mongodb').MongoClient;
var DataBaseConfig = require('../Config/DataBase');
var Misc = require('../Handler/Misc');

if (!MongoClient.connected)
{
    MongoClient.connect('mongodb://' + DataBaseConfig.USERNAME + ':' + DataBaseConfig.PASSWORD + '@' + DataBaseConfig.HOST + ':' + DataBaseConfig.PORT + '/' + DataBaseConfig.DATABASE, function(err, db)
    {
        if (err)
            Misc.Log(err);
        else
            Misc.Log('MongoDB Connected');
    });
}

module.exports = MongoClient;
