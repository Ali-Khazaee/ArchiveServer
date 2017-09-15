var File = require('fs');

module.exports =
{
    PRIVATE_KEY: File.readFileSync('./System/Storage/PrivateKey.pem'),
    PUBLIC_KEY: File.readFileSync('./System/Storage/PublicKey.pem')
};
