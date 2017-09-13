var App        = require('express')();
var BodyParser = require('body-parser');
var CoreConfig = require("./System/Config/Core");

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
