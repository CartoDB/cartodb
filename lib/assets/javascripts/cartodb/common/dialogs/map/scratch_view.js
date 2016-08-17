var cdb = require('cartodb.js-v3');
var BaseDialog = require('../../views/base_dialog/view');

/**
 * Scratch modal
 */
module.exports = BaseDialog.extend({

  events: cdb.core.View.extendEvents({
    "click .js-option" : "_onOptionClick",
    "click .js-skip"   : "_onSkipClick"
  }),

  options: {
    skipDisabled: false
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
    var title = this._setTitle(this.table);

    return this._template({
      name: title,
      skipDisabled: this.options.skipDisabled
    });
  },

  _setTitle: function(vis) {
    if (vis.get('synchronization') && vis.get('synchronization').from_external_source) {
      return Sugar.String.titleize(vis.get('name'));
    }
    return vis.get('name');
  },

  _onSkipClick: function(e) {
    this.killEvent(e);
    this.close();
    this.trigger("skip", this);
  },

  _onOptionClick: function(e) {
    this.killEvent(e);
    this.close();
    this.trigger("newGeometry", $(e.target).closest('.js-option').data("type"));
  }

});
