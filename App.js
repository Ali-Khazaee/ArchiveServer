const App            = require('express')();
const HTTP           = require('http').Server(App);
const BodyParser     = require('body-parser');
const MongoDB        = require('mongodb');
const CoreConfig     = require("./System/Config/Core");
const DataBaseConfig = require('./System/Config/DataBase');
const Misc           = require('./System/Handler/Misc');

MongoDB.MongoClient.connect('mongodb://' + DataBaseConfig.USERNAME + ':' + DataBaseConfig.PASSWORD + '@' + DataBaseConfig.HOST + ':' + DataBaseConfig.PORT + '/' + DataBaseConfig.DATABASE,
{
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 2000
},
function(error, database)
{
    if (error)
    {
        Misc.Log("[DB]: " + error);
        process.exit(1);
    }

    console.log('MongoDB Connected');

    global.DB = database.db("BioGram2");
    global.MongoID = MongoDB.ObjectID;

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
    App.get('/', function (req, res) { res.send(''); });

    HTTP.listen(CoreConfig.PORT, "0.0.0.0", function()
    {
        console.log("Running Server Port: " + CoreConfig.PORT);
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
