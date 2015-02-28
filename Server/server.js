if (Meteor.isServer) {

  Meteor.methods({
    sendSMS: function () {

      twilio = Twilio(accountSid, authToken);
        twilio.sendSms({
          to: "7324477268",
	        from: "+17324225154",
	        body: "Welcome to inforum",
        }, function(err, responseData) { //this function is executed when a response is received from Twilio
          if (!err) {
              console.log(responseData.from); // outputs "+14506667788"
              console.log(responseData.body); // outputs "word to your mother."
          }
      });
    }
  });

  Meteor.startup(function () {
    // code to run on server at startup
  });
}
