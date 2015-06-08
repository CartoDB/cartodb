var cdb = require('cartodb.js');
var BaseDialog = require('../../views/base_dialog/view');

/**
 * Scratch modal
 */
module.exports = BaseDialog.extend({

  events: {
    "click .js-option" : "_onOptionClick",
    "click .js-skip"   : "close"
  },

  initialize: function() {
    this.elder('initialize');

    if (!this.options.table) {
      throw new TypeError('table is required');
    }

    this.table = this.options.table;
    this._template = cdb.templates.getTemplate('common/dialogs/map/scratch_view_template');

  },

  // implements cdb.ui.common.Dialog.prototype.render
  render: function() {
    this.clearSubViews();
    BaseDialog.prototype.render.call(this);
    return this;
  },

  // implements cdb.ui.common.Dialog.prototype.render
  render_content: function() {
    return this._template({
      name: this.table.get("name")
    });
  },

  _onOptionClick: function(e) {
    this.killEvent(e);
    this.close();
    this.trigger("newGeometry", $(e.target).data("type"));
  },

  _ok: function() {
    this.close();
  }

});
