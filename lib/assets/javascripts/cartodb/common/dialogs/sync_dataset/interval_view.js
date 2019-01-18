var cdb = require('cartodb.js-v3');

/**
 * Sync interval
 */
module.exports = cdb.core.View.extend({

  tagName: "li",

  className: "Modal-listFormItem",

  events: {
    "click": "_onClick"
  },

  initialize: function() {
    this._setupModel();
    this._template = cdb.templates.getTemplate('common/dialogs/sync_dataset/interval_template');
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(this._template(this.model.attributes));
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:checked', this._onToggleChecked, this);
  },

  _setupModel: function() {
    this.model = this.options.model;
    this.model.set('id', this.cid);
  },

  _onClick: function(e) {
    this.killEvent(e);

    if (!this.model.get("disabled")) {
      this.model.set("checked", true);
      this.trigger("checked", this.model, this);
    }
  },

  _onToggleChecked: function() {
    this.render();
  }
});
