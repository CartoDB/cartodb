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
    // 'remove' would be a better name ofc, but there is already an internal method with that name in cdb.core.View
    this.model.destroy();
  },

  _onShowChange: function (m, show) {
    if (show) {
      this.$el.show();
      this.$el.removeClass('is-closing').addClass('is-opening');
    } else {
      this.$el.removeClass('is-opening').addClass('is-closing');
      this._delayDueToAnimation(function () {
        this.$el.hide();
      });
    }
  },

  _onDestroy: function () {
    this.hide();
    this._delayDueToAnimation(function () {
      this.clean();
    });
  },

  _delayDueToAnimation: function (fn) {
    // timeout value ought to match the .Dialog.is-closing animation duration.
    setTimeout(fn.bind(this), 120);
  }

});
