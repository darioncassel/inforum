MessageData = new Mongo.Collection('messages');

if (Meteor.isServer) {
  var Fiber = Npm.require('fibers');
  var accountSid = 'AC1b1073abee0a6a981c5b364196016cdb';
  var authToken = '87884be75ea60edbb8fa1d0a8081020f';
  twilio = Twilio(accountSid, authToken);

  var express = Meteor.npmRequire('express');
  var app = express();
  var bodyParser = Meteor.npmRequire('body-parser');
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.post('/', function (req, res) {
    var from = req.body.From;
    var text = req.body.Body.trim().toLowerCase();
    Fiber(function(){
      //if(MessageData.findOne({from: from})==null){
        MessageData.insert({from: from, counter: 0});
      //}
    }).run();
    var xml = flow(from, text);
    console.log(xml);
    res.type('text/xml');
    res.send(xml);
  });

  var server = app.listen(8000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Example app listening at http://%s:%s', host, port);
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
    },
    'clearDB': function() {
      MessageData.remove({});
    }
  });

  function flow(from, text){
    var xml = '<Response><Sms>Test</Sms></Response>';
    Fiber(function(){
      var user = MessageData.findOne({from: from})
      var counter = user.counter;
      console.log(counter);
      if(counter==0){
        if(text=="hello"){
          console.log('here');
          xml = '<Response><Sms>What would you like to study?</Sms></Response>';
          MessageData.update({_id: user._id}, {$inc: {counter: 1}});
        }else {
          xml ='<Response><Sms>What?</Sms></Response>';
        }
      }else if(counter==1){
        xml = '<Response><Sms>What is your zipcode?</Sms></Response>';
        MessageData.update({_id: user._id}, {$inc: {counter: 1}});
      }
    }).run();
    return xml;
  }
}
