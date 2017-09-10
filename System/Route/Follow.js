var express = require('express');

var ProfileRouter = express.Router();

ProfileRouter.post('/profile', function(req, res) {
    res.send(' /profile');
});

ProfileRouter.post('/profile2', function(req, res) {
    res.send(' /profile2');
});

module.exports = ProfileRouter;
