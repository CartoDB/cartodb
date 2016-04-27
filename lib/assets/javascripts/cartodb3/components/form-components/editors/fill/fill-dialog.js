var cdb = require('cartodb.js');
var template = require('./fill-dialog.tpl');

module.exports = cdb.core.View.extend({
  className: 'Editor-FormDialog is-opening',

  initialize: function () {
    this.listenTo(this.model, 'change:show', this._onShowChange);
    this.listenTo(this.model, 'destroy', this._onDestroy);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

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

  _onShowChange: function (m, show) {
    if (show) {
      this.$el.show();
      this.$el.removeClass('is-closing').addClass('is-opening');
    } else {
      this.$el.removeClass('is-opening').addClass('is-closing');
      this.$el.hide();
    }
  },

  _onDestroy: function () {
    this.hide();
    this.clean();
  }

});
