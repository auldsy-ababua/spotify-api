//server.js is entrypoint
//run npm install --save express
//run npm install --save unirest
//Create a folder inside spotify-recommend called public
//Place HTML file in public

var unirest = require('unirest');
var express = require('express');
var events = require('events');

//LINES 13-33: A function that will call Spotify api
//two args: endpoint name and obj containing args to give query string of endpoint
var getFromApi = function(endpoint, args) {
    //Event emitter is created to tell if info GET was successful or failed
    var emitter = new events.EventEmitter();
    //Unirest used to make GET requests to spotify API.
    //qs method used to add args as query strings
    unirest.get('https://api.spotify.com/v1/' + endpoint)
           .qs(args)
           //end funct called from HTTP res to tell that data is received triggers end event on emitter.
           .end(function(response) {
                //This attaches the res body parsed by unirest
                if (response.ok) {
                    emitter.emit('end', response.body);
                }
                //if err, err event is triggered on emitter, attaching err code returned by Unirest
                else {
                    emitter.emit('error', response.code);
                }
            });
    //Emitter is returned, whethor error or end.
    return emitter;
};

//LINES 37-60: Creates and outlines a server to make reqs to Spotify API
//37-38: Creates HTTP server w/node-statis serving front-end
var app = express();
app.use(express.static('public'));

//When req to /search/:name made...
app.get('/search/:name', function(req, res) {
    //You create a var searchReq = to getFromApi funct. (above) used
    //to call spotify API.
    //search is the endpoint. q, limit, and type are the args.
    var searchReq = getFromApi('search', {
        //searchReq calls getFromApi(), telling it to use
        //the /search?q=<name>&limit=1&type=artist endpoint
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

    //Then add listener to end eventEmitter returned from getFromApi
    searchReq.on('end', function(item) {
        //extracts artist from the object and returns it in json res
        var artist = item.artists.items[0];
        var idReq = getFromApi('artists/' + artist.id + '/related-artists');

        //Then add listener to end eventEmitter returned from getFromApi
        idReq.on('end', function(item) {
            //extracts artist from the object and returns it in json res
            artist.related = item.artists;
            res.json(artist);
        });
    });

    //and listener for error eventEmitter returned from getFromApi
    //if error, callback function sends statuscode to browser.
    searchReq.on('error', function(code) {
        res.sendStatus(code);
    });
});

app.listen(8080);
