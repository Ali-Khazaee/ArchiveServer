var express = require('express');
var jwt = require('jsonwebtoken');
var AuthConfig = require('../Config/Auth');

var AuthRouter = express.Router();

AuthRouter.post('/signin', function(req, res)
{
    res.json(
    {
        id: 1,
        username: 'admin',
        jwt: jwt.sign(
        {
            id: 1,
        }, AuthConfig.JWT_SECRET, { expiresIn: 60*60 }),
        verify: jwt.verify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNDk5Mjc5NDA4LCJleHAiOjE0OTkyODMwMDh9.G2BaryvqhNpseHhR8gGVylbEEG8hcWOT1LD9Bi_BcLE', AuthConfig.JWT_SECRET)
    });
});

module.exports = AuthRouter;
