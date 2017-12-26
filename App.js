const App            = require('express')();
const HTTP           = require('http').Server(App);
const BodyParser     = require('body-parser');
const CoreConfig     = require("./System/Config/Core");
const MongoDB        = require('mongodb');
const DataBaseConfig = require('./System/Config/DataBase');
const Misc           = require('./System/Handler/Misc');
const Notification   = require('./System/Handler/Notification');
const Chat           = require('./System/Handler/Chat');
const Auth           = require('./System/Handler/Auth');
const IO             = require('socket.io')(HTTP);

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

        Misc.Log('MongoDB Connected');

        global.DB = database;
        global.MongoID = MongoDB.ObjectID;
        global.ClientList = [];

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

        IO.on('connection', function(Socket)
        {
            Socket.on('Register', function(Data)
            {
                console.log(Socket.id);
                if (typeof ClientList[Socket.id] !== 'undefined')
                    return;

                let UserID = Auth.VerifyToken(Data.Token);

                if (UserID !== null)
                    ClientList[Socket.id] = { ID : UserID, Socket: Socket };
            });

            Socket.on('SendMessage',  async function(Data)
            {
                console.log(Socket.id);

                try
                {
                    if (ClientList[Socket.id] === undefined)
                        return;

                     //Chat.SendMessage(ClientList[Socket.id].ID, Data.Receiver, Data.Message, Data.ReplyToMessageID);
                }
                catch (e)
                {
                    console.log("Rid: " + e);
                }


            });

            Socket.on('IsTyping', function(Data)
            {
                if (typeof(ClientList[Socket.id]) === 'undefined')
                    return;

                Misc.Log(`IsTyping Received -> ${Data}`);
                Chat.IsTyping(ClientList[Socket.id].ID, Data.Receiver);
            });

            Socket.on('disconnect', function()
            {
                if (typeof(ClientList[Socket.id]) === 'undefined')
                    return;

                for (let SockID in ClientList)
                {
                    if (ClientList[SockID].Socket.id === Socket.id)
                    {
                        Misc.Log(`UserID -> ${ClientList[SockID].ID} just disconnected!`);

                        delete ClientList[SockID];
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
