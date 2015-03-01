MessageData = new Mongo.Collection('messages');
StudyGroups = new Mongo.Collection('groups');
NotesData = new Mongo.Collection('notes_room');

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
    flow(from, text, res);
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
      StudyGroups.remove({});
    },
    'viewUserDB': function() {
      console.log(MessageData.find().fetch());
    },
    'viewGroupDB': function() {
      console.log(StudyGroups.find().fetch());
    },
    'joinChat': function(id){
      Meteor.publish('room', function(){
        return NotesData.find({room: id});
      });
    },
    addNote: function(note) {
      NotesData.insert(note);
    },
    removeAllNotes: function() {
      NotesData.remove({});
    }
  });

  function flow(from, text, res){
    Fiber(function(){
      if(MessageData.findOne({from: from})==undefined){
        MessageData.insert({from: from, counter: 0, subject: '', zip: ''});
      }
      var xml = '<Response><Sms>Test</Sms></Response>';
      var user = MessageData.findOne({from: from})
      var counter = user.counter;
      if(counter==0){
        if(text=="hello"){
          //test
          xml = '<Response><Sms>What would you like to study?</Sms></Response>';
          MessageData.update({_id: user._id}, {$inc: {counter: 1}}, {upsert: true});
        }else {
          xml = "<Response><Sms>Send 'Hello' to begin.</Sms></Response>";
        }
      }else if(counter==1){
        MessageData.update({_id: user._id}, {$set: {subject: text}}, {upsert: true});
        xml = '<Response><Sms>What is your zipcode?</Sms></Response>';
        MessageData.update({_id: user._id}, {$inc: {counter: 1}}, {upsert: true});
      }else if(counter==2){
        MessageData.update({_id: user._id}, {$set: {zip: text}}, {upsert: true});
        var zip = Zipcodes.lookup(parseInt(text));
        var loc = [zip.longitude, zip.latitude];
        if(StudyGroups.findOne({subject: user.subject})==undefined){
          var group = {
            subject: user.subject,
            people: [from],
            loc: loc
          }
          StudyGroups.insert(group);
        }else {
          var thisGroup = StudyGroups.find({
            loc: {
              $geoWithin: {
                $center: [loc, 0.02699784*2] //6000 meters
              }
            }
          }).fetch()[0];
          if(thisGroup!=undefined){
            var arr = thisGroup.people.push(from);
            StudyGroups.update({_id: thisGroup._id}, {$set: {people: arr}});
          }else{
            var group = {
              subject: user.subject,
              people: [from],
              loc: loc
            }
            StudyGroups.insert(group);
          }
        }
        var uid = generateUUID();
        xml = '<Response><Sms>Thank you, we have matched you to a group: https://52.0.162.200:3000/chat/'+uid+'/</Sms></Response>';
        MessageData.update({_id: user._id}, {$set: {counter: 0}}, {upsert: true});
      }
      res.type('text/xml');
      res.send(xml);
    }).run();
  }

  Meteor.startup(function(){
    StudyGroups._ensureIndex({loc: "2d"});
  });

  function generateUUID() {
    var d = Date.now();
    var uuid = 'xxxx-4xxx-yxxx'.replace(/[xy]/g,function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x7|0x8)).toString(16);
    });
    return uuid;
  }
}
