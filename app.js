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
  req.on('data', (data) => {
    return req.rawBody += data;
  });
  req.on('end', () => {
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
var latestPosts = {"science": [], "futurology": [], "food": [], "foodLinks": []};
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
        posts[posts.length - 4].title,
        posts[posts.length - 5].title
      ]
      // Check futurology subreddit
      reddit.fetchPosts('r/futurology').then( data => {
        posts = data.posts;
        latestPosts.futurology = [
          posts[posts.length - 1].title,
          posts[posts.length - 2].title,
          posts[posts.length - 3].title,
          posts[posts.length - 4].title,
          posts[posts.length - 5].title
        ]
        reddit.fetchPosts('r/food').then( data => {
          posts = data.posts;
          latestPosts.food = [
            posts[posts.length - 1].title,
            posts[posts.length - 2].title,
            posts[posts.length - 3].title,
            posts[posts.length - 4].title,
            posts[posts.length - 5].title
          ]
          latestPosts.foodLinks = [
            posts[posts.length - 1].permalink,
            posts[posts.length - 2].permalink,
            posts[posts.length - 3].permalink,
            posts[posts.length - 4].permalink,
            posts[posts.length - 5].permalink
          ]
          fulfill(true);
        })
      })
    })
    setTimeout(updatePosts, 3000)
  });
}
updatePosts().then( data => {
  var scienceApp = new alexa.app('science');
  scienceApp.launch(function(request,response) {
    response.say("Here is the latest post on the science subreddit. " + getPost(0, "science"), "science");
  });
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
        var items = {"1st": 0, "2nd": 1, "3rd": 2, "first": 0, "second": 1, "third": 2, '4th': 3, 'fourth': 3, '5th': 4, 'fifth': 4};
        try {
          response.say("Here is the " + request.slot("Index") + " post in the science subreddit. " + getPost(items[request.slot("Index")], "science"));
        } catch(err) {
          response.reprompt("You asked for an incorrect value. Ask again, requesting only for the first to the fifth post.");
        }
      }
  );
  scienceApp.express(app, "/echo/");
  var futurologyApp = new alexa.app('futurology');
  futurologyApp.launch(function(request,response) {
    response.say("Here is the latest post on the futurology subreddit. " + getPost(0, "futurology"), "futurology");
  });
  futurologyApp.intent("LatestPost",
    {
      "utterances": [
        "latest science post",
        "recent science news"
      ]
    },
    function(request,response) {
      response.say("Here is the latest post on the futurology subreddit. " + getPost(0, "futurology"));
    }
  );
  futurologyApp.intent("SpecificPost",
      {
        "slots": {"Index": "POST_LOCATION"},
        "utterances": ["{Index} post"]
      },
      function(request, response) {
        var items = {"1st": 0, "2nd": 1, "3rd": 2, "first": 0, "second": 1, "third": 2, '4th': 3, 'fourth': 3, '5th': 4, 'fifth': 4};
        try {
          response.say("Here is the " + request.slot("Index") + " post in the futurology subreddit. " + getPost(items[request.slot("Index")], "futurology"));
        } catch(err) {
          response.reprompt("You asked for an incorrect value. Ask again, requesting only for the first to the fifth post.");
        }
      }
  );
  futurologyApp.express(app, "/echo/");
  var foodApp = new alexa.app('food');
  foodApp.launch(function(request,response) {
    response.say("Here is the latest recipe in the food subreddit. " + getPost(0, "food") + ". Check your Alexa app for the post link.");
    response.card(getPost(0, "food"), getPost(0, "foodLinks"));
  });
  foodApp.intent("LatestPost",
    {
      "utterances": [
        "latest science post",
        "recent science news"
      ]
    },
    function(request,response) {
      response.say("Here is the latest recipe in the food subreddit. " + getPost(0, "food") + ". Check your Alexa app for the post link.");
      response.card(getPost(0, "food"), getPost(0, "foodLinks"));
    }
  );
  foodApp.intent("SpecificPost",
      {
        "slots": {"Index": "POST_LOCATION"},
        "utterances": ["{Index} post"]
      },
      function(request, response) {
        var items = {"1st": 0, "2nd": 1, "3rd": 2, "first": 0, "second": 1, "third": 2, '4th': 3, 'fourth': 3, '5th': 4, 'fifth': 4};
        try {
          response.say("Here is the " + request.slot("Index") + " recipe in the food subreddit. " + getPost(items[request.slot("Index")], "food") + ". Check your Alexa app for the post link.");
          response.card(getPost(items[request.slot("Index")], "food"), getPost(items[request.slot("Index")], "foodLinks"));
        } catch(err) {
          response.reprompt("You asked for an incorrect value. Ask again, requesting only for the first to the fifth recipe.");
        }
      }
  );
  foodApp.express(app, "/echo/");

  // Launch /echo/test in your browser with a GET request!
  app.listen(PORT);
  console.log("Listening on port "+PORT);
});
