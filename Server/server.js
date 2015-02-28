if (Meteor.isServer) {

  var accountSid = 'AC1b1073abee0a6a981c5b364196016cdb';
  var authToken = '87884be75ea60edbb8fa1d0a8081020f';
  twilio = Twilio(accountSid, authToken);

  Meteor.methods({
    sendSMS: function () {
      twilio.sendSms({
        to: "7324477268",
        from: "+17324225154",
        body: "Welcome to inforum",
      }, function(err, responseData) {
        if (!err) {
          console.log(responseData.from);
          console.log(responseData.body);
        }else {
          console.log(err);
        }
      });
    }
  });

  Meteor.startup(function () {
    /*
    Meteor.setInterval(function(){
      twilio.messages.list(function(err, data) {
        data.messages.forEach(function(message) {
            console.log(message.body);
        });
      }, 100000);
    });
    */
  });
}
