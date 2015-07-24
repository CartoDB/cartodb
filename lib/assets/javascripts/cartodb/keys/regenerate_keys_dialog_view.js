var cdb = require('cartodb.js');
var BaseDialog = require('../common/views/base_dialog/view');
var _ = require('underscore');

/**
 * Lock/unlock datasets/maps dialog.
 */
module.exports = BaseDialog.extend({

  events: function() {
    return _.extend({}, BaseDialog.prototype.events, {
      'click .js-ok' : '_regenerateKeys'
    });
  },

  initialize: function() {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('keys/views/regenerate_keys_dialog');
  },

  render_content: function() {
    return this.template({
      type: this.options.type,
      scope: this.options.scope,
      form_action: this.options.form_action,
      authenticity_token: this.options.authenticity_token,
      method: this.options.method || 'post'
    });
  },

  _regenerateKeys: function() {
    this.trigger('done');
    this.close();
  }
});
