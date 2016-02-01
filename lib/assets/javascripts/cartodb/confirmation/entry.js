var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var MainView = require('./main_view');

$(function() {
  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';
    var confirmation = new MainView({
      userCreationId: user_creation_id,
      username: user_name,
      customHosted: is_custom_install,
      userURL: user_url
    });
  });
});