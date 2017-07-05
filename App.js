var express     = require('express');
var App         = express();
var bodyParser  = require('body-parser');

App.disable("x-powered-by");

App.use(bodyParser.urlencoded({ extended: true }));
App.use(bodyParser.json());

App.use('/', require('./System/Route/Post'));
App.use('/', require('./System/Route/Profile'));

App.listen(1000, function() { console.log("Running Server Port: 1000"); });

module.exports = App;
