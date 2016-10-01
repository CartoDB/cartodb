var CoreView = require('backbone/core-view');

module.exports = CoreView.extend({
  className: 'CDB-Box-modal Table-editor',

  initialize: function () {
    this.listenTo(this.model, 'change:show', this._onShowChange);
    this.listenTo(this.model, 'destroy', this._onDestroy);
  },

  render: function () {
    this.clearSubViews();

    var view = this.model.createContentView();
    this.addView(view);
    view.render();
    this.$el.append(view.el);
    this.$el.css(this.options.position);

    return this;
  },

  show: function () {
    this.model.show();
  },

  hide: function () {
    this.model.hide();
  },

  destroy: function () {
    this.model.destroy();
  },

  _onShowChange: function (m, show) {
    this.$el[show ? 'show' : 'hide']();
  },

  _onClose: function () {
    this.destroy();
  },

  _onDestroy: function () {
    this.hide();
    this.clean();
  }

});
