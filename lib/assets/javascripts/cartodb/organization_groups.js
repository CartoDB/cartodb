var $ = require('jquery');
var cdb = require('cartodb.js');

$(function() {
  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';
    cdb.config.set('url_prefix', window.user_data.base_url);

    $(document.body).bind('click', function() {
      cdb.god.trigger('closeDialogs');
    });

    // TODO: implement groups UI
    var user = new cdb.admin.User(window.user_data);
    window.u = user; // TODO: remove
  });
});
