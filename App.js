var App            = require('express')();
var BodyParser     = require('body-parser');
var CoreConfig     = require("./System/Config/Core");
var MongoDB        = require('mongodb');
var DataBaseConfig = require('./System/Config/DataBase');

MongoDB.MongoClient.connect('mongodb://' + DataBaseConfig.USERNAME + ':' + DataBaseConfig.PASSWORD + '@' + DataBaseConfig.HOST + ':' + DataBaseConfig.PORT + '/' + DataBaseConfig.DATABASE, function(error, database)
{
    if (error)
    {
        console.log(err);
        process.exit(1);
    }

    global.DB = database;
    global.MongoID = MongoDB.ObjectID;

    console.log('MongoDB Connected');

    App.disable("x-powered-by");

    App.use(BodyParser.json());
    App.use(BodyParser.urlencoded({ extended: true }));

    App.use('/', require('./System/Route/Auth'));
    App.use('/', require('./System/Route/Follow'));
    App.use('/', require('./System/Route/Misc'));
    App.use('/', require('./System/Route/Notification'));
    App.use('/', require('./System/Route/Post'));
    App.use('/', require('./System/Route/Profile'));

    App.listen(CoreConfig.PORT, "127.0.0.1", function()
    {
        console.log("Running Server Port: " + CoreConfig.PORT);
    });
});

/*
    -1 = DB Error
    -2 = RateLimit Exceed
    -3 = Auth Failed
 */
