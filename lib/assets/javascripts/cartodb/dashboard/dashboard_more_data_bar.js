cdb.admin.dashboard.MoreDataBar = cdb.core.View.extend({

  tagName: "article",
  className: "more_data",

  initialize: function() {

    this.model      = new cdb.core.Model();
    this.model.bind('change:visible', this._toggleVisibility, this);

    this.template = cdb.templates.getTemplate('common/views/dashboard_more_data_bar');

  },

  _toggleVisibility: function() {
    if (this.model.get("visible")) this._show();
    else this._hide();
  },

  show: function() {
    this.model.set("visible", true);
  },

  hide: function() {
    this.model.set("visible", false);
  },

  _show: function() {
    this.$el.show();
  },

  _hide: function() {
    this.$el.hide();
  },

  render: function() {

    this.$el.html(this.template(this.model.toJSON()));

    return this;

  }

});
