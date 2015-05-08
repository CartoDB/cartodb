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
      type: this.options.type
    });
  },

  _regenerateKeys: function() {
    this.trigger('done');
    this.close();
  }
});
