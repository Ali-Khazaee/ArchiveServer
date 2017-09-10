var Cluster = require('cluster');

if (Cluster.isMaster)
{
    var NumberWorkers = require('os').cpus().length;

    console.log('Master Cluster Setting Up ' + NumberWorkers + ' Workers ...');

    for (var I = 0; I < NumberWorkers; I++)
    {
        Cluster.fork();
    }

    Cluster.on('online', function(worker)
    {
        console.log('Worker ' + worker.process.pid + ' Is Online');
    });

    Cluster.on('exit', function(worker, code, signal)
    {
        console.log('Worker ' + worker.process.pid + ' Died With Code: ' + code + ', And Signal: ' + signal);
        console.log('Starting a new worker');

        Cluster.fork();
    });
}
else
{
    var App        = require('express')();
    var BodyParser = require('body-parser');

    App.disable("x-powered-by");

    App.use(BodyParser.json());
    App.use(BodyParser.urlencoded({ extended: true }));

    App.use('/', require('./System/Route/Auth'));
    App.use('/', require('./System/Route/Follow'));
    App.use('/', require('./System/Route/Misc'));
    App.use('/', require('./System/Route/Notification'));
    App.use('/', require('./System/Route/Post'));
    App.use('/', require('./System/Route/Profile'));

    App.listen(1000, function() { console.log("Running Server Port: 1000, Proccess: " + process.pid); });
}
