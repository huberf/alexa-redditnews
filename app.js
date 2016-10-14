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
var latestPosts = {"science": [], "futurology": []};
function getPost(index, table) {
  return latestPosts[table][index];
}

function updatePosts() {
  return new Promise(function(fulfill, reject) {
    console.log("Updating posts.");
    // Check science subreddit
    reddit.fetchPosts('r/science').then( data => {
      posts = data.posts;
      latestPosts.science = [
        posts[posts.length - 1].title,
        posts[posts.length - 2].title,
        posts[posts.length - 3].title,
        posts[posts.length - 4].title
      ]
      // Check futurology subreddit
      reddit.fetchPosts('r/futurology').then( data => {
        posts = data.posts;
        latestPosts.futurology = [
          posts[posts.length - 1].title,
          posts[posts.length - 2].title,
          posts[posts.length - 3].title,
          posts[posts.length - 4].title
        ]
        fulfill(true);
      })
    })
    setTimeout(updatePosts, 3000)
  });
}
updatePosts().then( data => {
  var scienceApp = new alexa.app('science');
  scienceApp.launch(function(request,response) {
    response.say("Here is the latest post on the science subreddit. " + getPost(0), "science");
  });
  scienceApp.dictionary = {"names":["matt","joe","bob","bill","mary","jane","dawn"]};
  scienceApp.intent("LatestPost",
    {
      "utterances": [
        "latest science post",
        "recent science news"
      ]
    },
    function(request,response) {
      response.say("Here is the latest post on the science subreddit. " + getPost(0, "science"));
    }
  );
  scienceApp.intent("SpecificPost",
      {
        "slots": {"Index": "POST_LOCATION"},
        "utterances": ["{Index} post"]
      },
      function(request, response) {
        var items = {"1st": 0, "2nd": 1, "3rd": 2, "first": 0, "second": 1, "third": 2};
        try {
          response.say("Here is the " + request.slot("Index") + " post in the science subreddit. " + getPost(items[request.slot("Index")]), "science");
        } catch(err) {
          response.say("Something went wrong. Try a different value.");
        }
      }
  );
  scienceApp.express(app, "/echo/");
  var futurologyApp = new alexa.app('futurology');
  futurologyApp.launch(function(request,response) {
    response.say("Here is the latest post on the science subreddit. " + getPost(0), "futurology");
  });
  futurologyApp.dictionary = {"names":["matt","joe","bob","bill","mary","jane","dawn"]};
  futurologyApp.intent("LatestPost",
    {
      "utterances": [
        "latest science post",
        "recent science news"
      ]
    },
    function(request,response) {
      response.say("Here is the latest post on the science subreddit. " + getPost(0, "futurology"));
    }
  );
  futurologyApp.intent("SpecificPost",
      {
        "slots": {"Index": "POST_LOCATION"},
        "utterances": ["{Index} post"]
      },
      function(request, response) {
        var items = {"1st": 0, "2nd": 1, "3rd": 2, "first": 0, "second": 1, "third": 2};
        try {
          response.say("Here is the " + request.slot("Index") + " post in the science subreddit. " + getPost(items[request.slot("Index")]), "futurology");
        } catch(err) {
          response.say("Something went wrong. Try a different value.");
        }
      }
  );
  futurologyApp.express(app, "/echo/");

  // Launch /echo/test in your browser with a GET request!

  app.listen(PORT);
  console.log("Listening on port "+PORT);
});
