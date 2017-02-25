var express = require('express'), app = express();

var MongoClient = require('mongodb').MongoClient;

//URL is saved as an environment variable in the Heroku config to protect username and password
var URL = process.env.MONGOLAB_URI;

MongoClient.connect(URL, function(err, db) {
  if (err) return console.log(err);
  var collection = db.collection('urls');
  
  app.get('/https?://*.*', function(req, res) {
    //If parameter is a legit url, first check to see whether it already exists in the database collection
    collection.find({original_url: req.originalUrl.slice(1)}, {_id: 0, original_url: 1, short_url: 1}).toArray(function(err, docs) {
      if (err) throw err;
      if (docs.length < 1) {
        //If url doesn't exist in the collection, generate a random short url and add it to the collection, then display it
        var randNum = parseInt(Math.random() * 9999);
        collection.insert({original_url: req.originalUrl.slice(1), short_url: "https://" + req.headers.host + "/" + randNum}, function(err) {
          if (err) return console.log(err);
          collection.find({original_url: req.originalUrl.slice(1)}, {_id: 0, original_url: 1, short_url: 1}).toArray(function(err, docs) {
            if (err) throw err;
            console.log("Added " + docs[0].original_url + " to database");
            res.send(docs[0]);
          });
        });  
      }
      else {
        //If it does exist in the collection, simply send the document to the user
        console.log(docs[0].original_url + " already in database");
        res.send(docs[0]);
      }
    });
  });
  
  app.get('/:param', function (req, res) {
    collection.find({short_url: "https://" + req.headers.host + "/" + req.params.param}, {_id: 0, original_url: 1, short_url: 1}).toArray(function(err, docs) {
      if (err) throw err;
      if (docs.length > 0) {
        //If the passed url is a shortened version of a previously inserted url, then redirect to the original url
        console.log("Redirecting to " + docs[0].short_url);
        res.redirect(docs[0].original_url);
      } else {
        //If neither the url is a shortened version of a url from the db collection, nor the parameter is a valid url, display a json error
        console.log("Invalid url inserted");
        res.send({error: "Wrong url format, make sure you have a valid protocol and real site."});
      }        
    });
  });
  
  app.use(express.static(__dirname + '/public'));
  
  var port = process.env.PORT || 8080;
  app.listen(port, function() {
    console.log('Listening on port ' + port);
  });
  
});