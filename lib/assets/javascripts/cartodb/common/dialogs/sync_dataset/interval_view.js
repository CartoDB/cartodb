var cdb = require('cartodb.js');

/**
 * Sync interval
 */
module.exports = cdb.core.View.extend({

  tagName: "li",

  className: "DatasetSelected-syncOptionsItem",

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
  },

  _onClick: function(e) {
    this.killEvent(e);

    if (!this.model.get("disabled")) {
      this.model.set("checked", true);
      this.trigger("checked", this.model, this);
    }
  },

  _onToggleChecked: function() {
    if (this.model.get("checked")) {
      this.$(".js-interval").addClass("is-checked");
      this.$(".js-input").addClass("is-checked");
    } else {
      this.$(".js-interval").removeClass("is-checked");
      this.$(".js-input").removeClass("is-checked");
    }
  }
});
