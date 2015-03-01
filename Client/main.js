Router.configure({
	layoutTemplate: 'ApplicationLayout'
});

Router.route('/', function(){this.render('main');});
Router.route('/chat/:id', function() {
  this.render('chat');
  var id = this.params.id;
  Meteor.call('joinChat', id);
  Meteor.subscribe('room');
});

NotesData = new Mongo.Collection("notes");

if (Meteor.isClient) {
  Template.chat.events({
		'click #add' : function () {
      console.log('here');
			if(!$('#noteInput').val().match(/^\s*$/)){
				var note = {
            room: window.location.pathname.slice(6),
						text: $('#noteInput').val()
				};
				Meteor.call('addNote', note);
			}
			$('#noteInput').val('');
			$('#noteInput').focus();
		},
		'keypress input' : function (event) {
			if(event.which===13){
        console.log('here');
				if(!$('#noteInput').val().match(/^\s*$/)){
					var note = {
            room: window.location.pathname.slice(1),
						text: $('#noteInput').val()
					};
					Meteor.call('addNote', note);
				}
				$('#noteInput').val('');
			}
		}
	});

	Template.chat.helpers({
		notes: function() {
			return NotesData.find().fetch();
		}
	});

	Template.note.rendered = function() {
		$('#notesdata').scrollTop($('#notesdata').prop("scrollHeight"));
	}

	Handlebars.registerHelper('linkify', function(text){
		var linkedText = Autolinker.link(text, {stripPrefix: false});
		var url = new RegExp(/<a\b[^>]*>(.*?)<\/a>/g);
		var str = Handlebars._escape("");
		while(match = url.exec(linkedText)){
			str += Handlebars._escape(linkedText.substring(0, match.index));
			str += linkedText.substring(match.index, match.index+match[0].length);
			linkedText = linkedText.substring(match.index+match[0].length);
			url.lastIndex = 0;
		}
		str += Handlebars._escape(linkedText);
		return new Handlebars.SafeString(str);
	});

}
