var alexa = require("alexa-app");
var reddit = require('redd');

var redditReader = new alexa.app('reddit');
redditReader.launch((req, res) => {
  var d = require('domain').create();
  d.on('error', function() {
    res.say('Something went wrong. I offer my most sincere apology. Try again later after my overlord has diagnosed the issue.');
    res.send();
  });
  d.run(function() {
    reddit('science', function(err, data) {
      console.log('Retrieved posts');
      console.log(data);
      if (err) {
        res.say('Something went wrong. I offer my most sincere apology. Try again later after my overlord has diagnosed the issue.');
        res.send();
      }
      var posts = data;
      res.say(`The latest post is, ${posts[posts.length - 1].data.title}`);
      res.send();
    });
  });
  return false;
});
redditReader.intent('LatestPost',
  {
    "slots": {}
  },
  (req, res) => {
    var d = require('domain').create();
    d.on('error', function() {
      res.say('Something went wrong. I offer my most sincere apology. Try again later after my overlord has diagnosed the issue.');
      res.send();
    });
    d.run(function() {
      reddit('science', function(err, data) {
        console.log('Retrieved posts');
        console.log(data);
        if (err) {
          res.say('Something went wrong. I offer my most sincere apology. Try again later after my overlord has diagnosed the issue.');
          res.send();
        }
        var posts = data;
        res.say(`The latest post is, ${posts[posts.length - 1].data.title}`);
        res.send();
      });
    });
    return false;
  }
);
redditReader.intent("SpecificPost",
    {
      "slots": [{"Index": "POST_LOCATION"}],
    },
    function(req, res) {
      var items = {"1st": 0, "2nd": 1, "3rd": 2, "first": 0, "second": 1, "third": 2, '4th': 3, 'fourth': 3, '5th': 4, 'fifth': 4};
      var d = require('domain').create();
      d.on('error', function() {
        res.say('Something went wrong. I offer my most sincere apology. Try again later after my overlord has diagnosed the issue.');
        res.send();
      });
      d.run(function() {
        reddit('science', function(err, data) {
          console.log('Retrieved posts');
          console.log(data);
          if (err) {
            res.say('Something went wrong. I offer my most sincere apology. Try again later after my overlord has diagnosed the issue.');
            res.send();
          }
          posts = data;
          try {
            res.say("Here is the " + req.slot("Index") + " post. " + posts[(posts.length - 1) - items[req.slot("Index")]].data.title);
            res.send();
          } catch(err) {
            res.say("You asked for an incorrect post number. Ask again, requesting only for the first to the fifth one.").shouldEndSession(false).reprompt('I\'m still listening');
            res.send();
          }
        });
      });
      return false;
    }
);
redditReader.intent('AMAZON.HelpIntent',
    {},
    (req, res) => {
      res.say('You can use me to read the latest posts from the science subreddit, saying something like latest post or third post').shouldEndSession(false).reprompt('I\'m still listening.');
    }
);
redditReader.intent("AMAZON.StopIntent",
  {
    "slots": [],
  },
  function(request, response) {
    console.log('Stopping skill');
    response.say("Goodbye.");
  }
);
redditReader.intent("AMAZON.CancelIntent",
  {
    "slots": [],
  },
  function(request, response) {
    console.log('Cancelling skill');
    response.say("Cancelled.");
  }
);

exports.handler = redditReader.lambda();
