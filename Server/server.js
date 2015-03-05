MessageData = new Mongo.Collection('messages');
StudyGroups = new Mongo.Collection('groups');
NotesData = new Mongo.Collection('notes_room');
UserData = new Mongo.Collection('users_server');
GroupsData = new Mongo.Collection('groups_server');

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

  //Clear old study groups
  Meteor.setInterval( function(){
      var curTime = moment().format('X');
      var studyArr = StudyGroups.find().fetch();
      var noteArr = NotesData.find().fetch();
      for (var i=0; i<studyArr.length; i++){
        if (curTime - studyArr[i].time > 3600){
          StudyGroups.remove(studyArr[i]._id);
        }
      }
      for (var i=0; i<noteArr.length; i++){
        if (curTime - noteArr[i].timestamp > 3600){
          NotesData.remove(noteArr[i]._id);
        }
      }
  }, 300000); //Check every 5 minutes

  var server = app.listen(8000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('App listening at http://%s:%s', host, port);
  });

  Meteor.publish('usersData', function() {
    return Meteor.users.find();
  });

  Meteor.publish('groups_fb', function(){
    return GroupsData.find();
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
        return NotesData.find();
      });
    },
    'modifyUser': function(id, username){
      if(username==null){
        Meteor.users.update({_id:id}, {$set:{"profile.username":"Anonymous"}}, {upsert: true});
      }else{
        Meteor.users.update({_id:id}, {$set:{"profile.username":result}}, {upsert: true});
      }
    },
    addNote: function(note) {
      NotesData.insert(note);
    },
    removeAllNotes: function() {
      NotesData.remove({});
    },
    addgroup: function(group) {
      GroupsData.insert(group);
    },
    removeAllGroups: function() {
      GroupsData.remove({});
    },
    joinGroup: function(userid, id) {
      var obj = GroupsData.findOne({id: id});
      var arr = obj.people;
      if(!_.contains(arr, userid)){
        arr.push(userid);
      }
      GroupsData.update({id: id}, {$set: {people: arr}});
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
      var uuid = generateUUID();
      if(counter==0){
        if(text=="hello"){
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
        var zipReg = new RegExp(/\d{5}/);
        if (zipReg.test(text)){
          MessageData.update({_id: user._id}, {$set: {zip: text}}, {upsert: true});
          var geo = new GeoCoder();
          var result = geo.geocode(text);
          var loc = [result[0].longitude, result[0].latitude];
          if(StudyGroups.findOne({subject: user.subject})==undefined){
            var group = {
              subject: user.subject,
              people: [from],
              loc: loc,
              uuid: uuid,
              time: moment().format("X")
            }
            StudyGroups.insert(group);
          }else {
            var thisGroup = StudyGroups.find({
              loc: {
                $geoWithin: {
                  $center: [loc, 0.02699784*5.365] //3000 * 5.365 meters =  10 miles
                }
              }
            }).fetch()[0];
            if(thisGroup!=undefined){
              var arr = thisGroup.people;
              arr.push(from);
              uuid = thisGroup.uuid;
              StudyGroups.update({_id: thisGroup._id}, {$set: {people: arr}});
            }else{
              var group = {
                subject: user.subject,
                people: [from],
                loc: loc,
                uuid: uuid,
                time: moment().format("X")
              }
              StudyGroups.insert(group);
            }
          }
          xml = '<Response><Sms>Thank you, we have matched you to a group: http://inforum.me/chat/'+uuid+'/</Sms></Response>';
          MessageData.update({_id: user._id}, {$set: {counter: 0}}, {upsert: true});
        }
        else{
          xml = "<Response><Sms>Please enter a valid 5-digit zipcode.</Sms></Response>";
        }
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

  function buildRegExp(searchText) {
    // this is dumb implementation
    var parts = searchText.trim().split(' ');
    return new RegExp("(" + parts.join('|') + ")", "ig");
  }
}
