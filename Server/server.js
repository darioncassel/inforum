MessageData = new Mongo.Collection('messages');

if (Meteor.isServer) {
  var Fiber = Npm.require('fibers');
  var accountSid = 'AC1b1073abee0a6a981c5b364196016cdb';
  var authToken = '87884be75ea60edbb8fa1d0a8081020f';
  twilio = Twilio(accountSid, authToken);

  var resp = new twilio.TwimlResponse();

  var resp = new twilio.TwimlResponse();

  resp.sms('Welcome to inforum!');

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
    'updateDB': function () {
      console.log('here');
      /*
      Fiber(function(){
        twilio.messages.list(function(err, data) {
          data.messages.forEach(function(message) {
              MessageData.insert({from: message.from, body: message.body});
          });
        });
      }).run();
      */
    }
  });
/*
  Router.route('/api/twiml/sms', 'POST', function() {
    var rawIn = this.request.body;
    if (Object.prototype.toString.call(rawIn) == "[object Object]") {
        MessageData.insert(rawIn);
    }

    var question = {};
    if (rawIn.Body) {
        question.inputQuestion = rawIn.Body;
        question.source = "sms";
    } else if (rawIn.TranscriptionText) {
        question.inputQuestion = rawIn.TranscriptionText;
        question.source = "voicemail";
    } else {
        return;
    }
    question.inputName = rawIn.From;

    var toOrig = rawIn.To;
    toOrig = toOrig.replace(/\+1/g, "");
    var toPretty = '('+toOrig.substr(0,3)+') '+toOrig.substr(3,3)+'-'+toOrig.substr(6,10);
    var eventDetails = Events.findOne({phone: toPretty});

    if (_.size(eventDetails) == 0) {
        return;
    } else {
        question.slug = eventDetails.slug;
    }

    Meteor.call('questionCreate', question, function(error, res) {

    });

    var xml = '<Response><Sms>Thank you for submitting your question!</Sms></Response>';
    return [200, {"Content-Type": "text/xml"}, xml];
  });
*/
  Meteor.startup(function () {
    //aksdklsja
  });
}
