var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');

app.disable("x-powered-by");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/', function(req, res)
{
    res.sendStatus(200);
});

app.listen(1000, function() { console.log("Running Server Port: 1000"); });
