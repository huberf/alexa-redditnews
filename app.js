// Start up the server
var express = require('express');
var alexa = require('alexa-app');
var verifier = require('alexa-verifier');
var bodyParser = require('body-parser');

var app = express();
var PORT = process.env.PORT || 8080;
app.use(function(req, res, next) {
  if (!req.headers.signaturecertchainurl) {
    return next();
  }

  // mark the request body as already having been parsed so it's ignored by
  // other body parser middlewares
  req._body = true;
  req.rawBody = '';
  req.on('data', function(data) {
    return req.rawBody += data;
  });
  req.on('end', function() {
    var cert_url, er, error, requestBody, signature;
    try {
      req.body = JSON.parse(req.rawBody);
    } catch (error) {
      er = error;
      req.body = {};
    }
    cert_url = req.headers.signaturecertchainurl;
    signature = req.headers.signature;
    requestBody = req.rawBody;
    verifier(cert_url, signature, requestBody, function(er) {
      if (er) {
        console.error('error validating the alexa cert:', er);
        res.status(401).json({ status: 'failure', reason: er });
      } else {
        next();
      }
    });
  });
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine','ejs');


var reddit = require('fetch-reddit');
var latestPosts = [];
function getPost(index) {
  return latestPosts[index];
}

function updatePosts() {
  return new Promise(function(fulfill, reject) {
    console.log("Updating posts.");
    reddit.fetchPosts('r/science').then( data => {
      posts = data.posts;
      latestPosts = [
        posts[posts.length - 1].title,
        posts[posts.length - 2].title, 
        posts[posts.length - 3].title,
        posts[posts.length - 4].title
      ]
      fulfill(true);
    })
    setTimeout(updatePosts, 3000)
  });
}
updatePosts().then( data => {
  var alexaApp = new alexa.app('test');
  alexaApp.pre = function() {
    reddit.fetchPosts('r/science').then( data => {
      posts = data.posts;
      latestPosts = [
        posts[posts.length - 1].title,
        posts[posts.length - 2].title, 
        posts[posts.length - 3].title,
        posts[posts.length - 4].title
      ]
    })
  }
  alexaApp.launch(function(request,response) {
    response.say("Here is the latest post on the science subreddit. " + getPost(0));
  });
  alexaApp.dictionary = {"names":["matt","joe","bob","bill","mary","jane","dawn"]};
  alexaApp.intent("LatestPost",
    {
      "utterances": [
        "latest science post",
        "recent science news"
      ]
    },
    function(request,response) {
      response.say("Here is the latest post on the science subreddit. " + getPost(0));
    }
  );
  alexaApp.intent("SpecificPost",
      {
        "slots": {"Index": "POST_LOCATION"},
        "utterances": ["{Index} post"]
      },
      function(request, response) {
        var items = {"1st": 0, "2nd": 1, "3rd": 2, "first": 0, "second": 1, "third": 2};
        try {
          response.say("Here is the " + request.slot("Index") + " post in the science subreddit. " + getPost(items[request.slot("Index")]));
        } catch(err) {
          response.say("Something went wrong. Try a different value.");
        }
      }
  );
  alexaApp.express(app, "/echo/");

  // Launch /echo/test in your browser with a GET request!

  app.listen(PORT);
  console.log("Listening on port "+PORT);
});
