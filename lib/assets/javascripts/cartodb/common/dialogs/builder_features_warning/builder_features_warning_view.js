var cdb = require('cartodb.js-v3');
var BaseDialog = require('../../views/base_dialog/view');
var _ = require('underscore-cdb-v3');

module.exports = BaseDialog.extend({

  events: function () {
    return _.extend({}, BaseDialog.prototype.events, {
      'click .js-ok': '_continue'
    });
  },

  initialize: function () {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('common/dialogs/builder_features_warning/template');
  },

  render_content: function () {
    return this.template({

    });
  },

  _continue: function () {
    this.close();
  }
});
