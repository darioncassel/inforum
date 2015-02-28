MessageData = new Mongo.Collection('messages');

if (Meteor.isServer) {
  var Fiber = Npm.require('fibers');
  var accountSid = 'AC1b1073abee0a6a981c5b364196016cdb';
  var authToken = '87884be75ea60edbb8fa1d0a8081020f';
  twilio = Twilio(accountSid, authToken);

  var express = Meteor.npmRequire('express');
  var app = express();
  /*
  app.post('/query', function(req, res) {
    console.log("here");
    if (twilio.validateExpressRequest(req, authToken)) {
        var twiml = new twilio.TwimlResponse();
        twiml.sms('Hi!  Thanks for checking out my app!')
        res.type('text/xml');
        res.send(twiml.toString());
    }
    else {
        res.send('you are not twilio. Buzz off.');
    }
  });
  //Here
  app.set('port',process.env.PORT || 8000);
  */

  app.get('/', function (req, res) {
    res.send('Hello World!')
  });

  var server = app.listen(8000, function () {
    var host = server.address().address
    var port = server.address().port
    console.log('Example app listening at http://%s:%s', host, port)
  });
  
  Meteor.methods({
    'sendSMS': function (number) {
      twilio.sendSms({
        to: number,
        from: "+17324225154",
        body: "Welcome to inforum",
      }, function(err, message) {
        if (!err) {
          console.log(message.to);
          console.log(message.body);
        }else {
          console.log(err);
        }
      });
    }
  });
}
