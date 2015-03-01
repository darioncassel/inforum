Router.configure({
	layoutTemplate: 'ApplicationLayout'
});

Router.route('/', function(){this.render('main');});
Router.route('/chat/:id', function() {
  this.render('chat');
  var id = this.params.id;
  Session.set('chapp-docid', id);
});

if (Meteor.isClient) {

}
