var express = require('express');

var PostRouter = express.Router();

PostRouter.post('/post', function(req, res) {
    res.send(' /post');
});

PostRouter.post('/post2', function(req, res) {
    res.send(' /post2');
});

module.exports = PostRouter;
