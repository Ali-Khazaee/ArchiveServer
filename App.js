var App            = require('express')();
var HTTP           = require('http').Server(App);
var BodyParser     = require('body-parser');
var CoreConfig     = require("./System/Config/Core");
var MongoDB        = require('mongodb');
var DataBaseConfig = require('./System/Config/DataBase');
var Misc           = require('./System/Handler/Misc');
var Notification   = require('./System/Handler/Notification');
var IO             = require('socket.io')(HTTP);

MongoDB.MongoClient.connect('mongodb://' + DataBaseConfig.USERNAME + ':' + DataBaseConfig.PASSWORD + '@' + DataBaseConfig.HOST + ':' + DataBaseConfig.PORT + '/' + DataBaseConfig.DATABASE,
{
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 2000
},
function(error, database)
{
    if (error)
    {
        Misc.Log(error);
        process.exit(1);
    }

    global.DB = database;
    global.MongoID = MongoDB.ObjectID;
    global.ClientList = [];

    Misc.Log('MongoDB Connected');

    App.disable("x-powered-by");

    App.use(BodyParser.json());
    App.use(BodyParser.urlencoded({ extended: true }));

    App.use('/', require('./System/Route/Admin'));
    App.use('/', require('./System/Route/Auth'));
    App.use('/', require('./System/Route/Follow'));
    App.use('/', require('./System/Route/Misc'));
    App.use('/', require('./System/Route/Notification'));
    App.use('/', require('./System/Route/Post'));
    App.use('/', require('./System/Route/Profile'));
    App.use('/', require('./System/Route/Search'));

    IO.on('connection', function(Socket)
    {
        Socket.on('Register', function(Data)
        {
            ClientList[Data.ID] = { "Socket": Socket };

            Notification.SendAllNotification(Data.ID);
        });

        Socket.on('disconnect', function()
        {
            for (var ID in ClientList)
            {
                if (ClientList[ID].Socket.id === Socket.id)
                {
                    delete ClientList[ID];
                    break;
                }
            }
        });
    });

    HTTP.listen(CoreConfig.PORT, "0.0.0.0", function()
    {
        Misc.Log("Running Server Port: " + CoreConfig.PORT);
    });
});

/*
    -1 = DB Error
    -2 = RateLimit Exceed
    -3 = BCrypt Hash Failed
    -4 = Auth Failed
    -5 = Admin Failed
    -6 = Request Failed
    -7 = Formidable Failed
 */
