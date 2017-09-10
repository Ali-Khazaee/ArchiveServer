var express = require('express');

var PostRouter = express.Router();

PostRouter.post('/post', function(req, res)
{
    var movie = new Movie(req.body);

    movie.save(function(err) {
        if (err) {
            return res.send(err);
        }

        res.send({ message: 'Movie Added' });
    });
});

PostRouter.post('/post2', function(req, res)
{
    Movie.find(function(err, movies) {
        if (err) {
            return res.send(err);
        }

        res.json(movies);
    });
});

module.exports = PostRouter;
