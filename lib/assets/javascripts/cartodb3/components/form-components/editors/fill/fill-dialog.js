var cdb = require('cartodb.js');

module.exports = cdb.core.View.extend({
  className: 'CDB-Box-modal Editor-FormDialog js-formDialog is-opening',

  initialize: function () {
    this._initBinds();
  },

  render: function () {
    this.clearSubViews(); // TODO: remove?
    this._renderContentView();
    return this;
  },

  _renderContentView: function () {
    var view = this.model.createContentView();
    this.addView(view);
    this.$el.append(view.render().$el);
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:show', this._onShowChange);
    this.listenTo(this.model, 'destroy', this._onDestroy);
  },

  _onShowChange: function (m, show) {
    if (show) {
      this.$el.show();
      this.$el.removeClass('is-closing').addClass('is-opening');
    } else {
      this.$el.removeClass('is-opening').addClass('is-closing');
      this.$el.hide();
    }
  },

  show: function () {
    this.model.show();
  },

  hide: function () {
    this.model.hide();
  },

  _onDestroy: function () {
    this.hide();
    this.clean();
  }
});
