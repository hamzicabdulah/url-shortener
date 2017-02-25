var express = require('express'), app = express();

var MongoClient = require('mongodb').MongoClient;

var URL = process.env.MONGOLAB_URI;

MongoClient.connect(URL, function(err, db) {
  if (err) return console.log(err);
  
  var collection = db.collection('urls');
  
  app.get('/https?://*.*', function(req, res) {
    collection.find({original_url: req.originalUrl.slice(1)}, {_id: 0, original_url: 1, short_url: 1}).toArray(function(err, docs) {
      if (err) throw err;
      if (docs.length < 1) {
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
        console.log(docs[0].original_url + " already in database");
        res.send(docs[0]);
      }
    });
  });
  
  app.get('/:param', function (req, res) {
    collection.find({short_url: "https://" + req.headers.host + "/" + req.params.param}, {_id: 0, original_url: 1, short_url: 1}).toArray(function(err, docs) {
      if (err) throw err;
      if (docs.length > 0) {
        console.log("Redirecting to " + docs[0].short_url);
        res.redirect(docs[0].original_url);
      } else {
        console.log("Invalid url inserted");
        res.send({error: "Wrong url format, make sure you have a valid protocol and real site."});
      }        
    });
  });
  
  app.listen(8080, function() {
    console.log('Listening on port 8080...');
  });

  
});