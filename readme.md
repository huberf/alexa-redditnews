This is a simple Alexa back-end which periodically checks for the latest posts
in various subreddits, and then makes them accesible to Amazon Alexa users
through corresponding Alexa skills.

It is fully prepared to be deployed to Heroku, and can also be run on a private
server.

Notes:
The server won't start accepting requests until posts from each subreddit have
been fully loaded. This is to prevent a users query from returning a null value.
Also, the utterances.txt and intents.json files are only there to serve as
examples of how to configure such things in the Amazon dashboard.
