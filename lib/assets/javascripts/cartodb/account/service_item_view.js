var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var ServiceOauth = require('../new_common/service_models/service_oauth_model');
var ServiceInvalidate = require('../new_common/service_models/service_invalidate_model');
var _ = require('underscore');

/**
 *  Service item view
 *
 *  Connect or disconnect from a service
 *
 */


module.exports = cdb.core.View.extend({

  _WINDOW_INTERVAL: 1000,

  className: 'Form-row',
  tagName: 'div',

  events: {
    'click .js-connect': '_connect',
    'click .js-disconnect': '_disconnect'
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('account/views/service_item');
  },

  render: function() {
    this.$el.html(this.template(this.model.attributes));
    return this;
  },

  _connect: function(e) {
    // var d = $(e.target).data();
    
    // if (!d.service) {
    //   throw new Error("Datasource name not specified");
    // }

    // var service = new ServiceOauth(null, { datasource_name: this.model.get('serviceName') });
    // service.fetch({
    //   success: function() { debugger },
    //   error: function() { debugger }
    // });
  },

  _disconnect: function() {
    var invalidateMdl = new ServiceInvalidate({ datasource: this.model.get('name') });
    invalidateMdl.destroy({
      complete: function() {
        debugger;
      }
    })
  },

  _openWindow: function(url) {
    var self = this;
    var i = window.open(url, null, "menubar=no,toolbar=no,width=600,height=495");
    var e = window.setInterval(function() {
      if (i && i.closed) {
        // done
        window.location.reload();
        clearInterval(e)
      } else if (!i) {
        // error :(
        console.log("render error");
        clearInterval(e)
      }
    }, this._WINDOW_INTERVAL);
  }

});
