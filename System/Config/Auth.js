var File = require('fs');

module.exports =
{
    ADMIN_SESSION: 'Ali123',
    PRIVATE_KEY: File.readFileSync('./System/Storage/PrivateKey.pem'),
    PUBLIC_KEY: File.readFileSync('./System/Storage/PublicKey.pem')
};
