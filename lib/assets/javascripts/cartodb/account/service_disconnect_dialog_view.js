var cdb = require('cartodb.js');
var BaseDialog = require('../new_common/views/base_dialog/view');
var _ = require('underscore');
var randomQuote = require('../new_common/view_helpers/random_quote');
var ServiceInvalidate = require('../new_common/service_models/service_invalidate_model');

/**
 *  Disconnect service or help user to disconnect it
 *  
 *  - It needs the service model
 */

module.exports = BaseDialog.extend({

  events: function() {
    return _.extend({}, BaseDialog.prototype.events, {
      'click .js-revoke': '_revokeAccess'
    });
  },

  initialize: function() {
    this.elder('initialize');
    this._initBinds();
  },

  render_content: function() {
    return cdb.templates.getTemplate('account/views/service_disconnect_dialog')(
      _.extend({
        quote: randomQuote()
      }, this.model.attributes)
    );
  },

  _initBinds: function() {
    this.model.bind('change:state', this._appendContent, this);
  },

  _appendContent: function() {
    this.$('.Dialog-content').html(this.render_content());
  },

  _revokeAccess: function() {
    this.model.set('state', 'loading');
    var self = this;
    var invalidateModel = new ServiceInvalidate({ datasource: this.model.get('name') });
    
    invalidateModel.destroy({
      success: function(mdl, r) {
        if (r.success) {
          self._reloadWindow();
        } else {
          self.model.set('state', 'error');  
        }
      },
      error: function() {
        self.model.set('state', 'error');
        self.close();
      }
    });
  },

  _reloadWindow: function() {
    window.location.reload();
  }

});
