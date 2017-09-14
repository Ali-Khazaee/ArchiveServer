var Winston = require('winston');

function Log(Message)
{
    Winston.remove(Winston.transports.File);
    Winston.debug(Message);
}

function FileLog(Message)
{
    Winston.add(Winston.transports.File, { filename: './System/Storage/Debug.log' });
    Winston.warn(Message);
}

module.exports.Log = Log;
module.exports.FileLog = FileLog;
