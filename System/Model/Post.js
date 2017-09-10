var Mongoose = require('mongoose');

var PostSchema = new Mongoose.Schema
({
    title: String,
    releaseYear: String,
    director: String,
    genre: String
});

module.exports = Mongoose.model('Post', PostSchema);
