var cdb = require('cartodb.js');

module.exports = cdb.core.View.extend({
  className: 'Dialog is-opening',

  initialize: function () {
    this.listenTo(this.model, 'change:show', this._onShowChange);
    this.listenTo(this.model, 'destroy', this._onDestroy);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html('<div class="Dialog-contentWrapper js-content"></div>');

    var view = this.model.createContentView();
    this.addView(view);
    view.render();
    this.$('.js-content').append(view.el);

    return this;
  },

  show: function () {
    this.model.show();
  },

  hide: function () {
    this.model.hide();
  },

  destroy: function () {
    // 'remove' would be a better name, but method is already "taken", by cdb.core.View internally
    this.model.destroy();
  },

  _onShowChange: function (m, isShown) {
    this.$el.toggle(!!isShown);
  },

  _onDestroy: function () {
    this.$el.hide();
    this.clean();
  }
});
