var AuthRouter = require('express').Router();

AuthRouter.post('/UsernameIsAvailable', function(req, res)
{
    var Username = req.body.Username;

    if (typeof Username === 'undefined' || Username === '')
        return res.json({ Message: 1 });

    if (Username.length < 3)
        return res.json({ Message: 2 });

    if (Username.length > 32)
        return res.json({ Message: 3 });

    Username = Username.toLowerCase();

    if (Username.search(/^(?![^a-z])(?!.*([_.])\1)[\w.]*[a-z]$/) === -1)
        return res.json({ Message: 4 });

    //if (empty($App->DB->Find('account', ['Username' => $Username], ["projection" => ["_id" => 1]])->toArray()))
        //res.json({ Message: 1000 });

    res.json({ Message: 5 });
});


module.exports = AuthRouter;
