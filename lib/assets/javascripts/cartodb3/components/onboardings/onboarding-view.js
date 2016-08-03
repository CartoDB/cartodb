var _ = require('underscore');
var CoreView = require('backbone/core-view');
var template = require('./onboarding.tpl');

// Ought to match the duration of the .Dialog.is-closing animation.
var CLOSE_DELAY_MS = 120;

module.exports = CoreView.extend({
  className: 'Onboarding is-opening',

  initialize: function () {
    this.listenTo(this.model, 'change:show', this._onShowChange);
    this.listenTo(this.model, 'destroy', this._onDestroy);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    var view = this.model.createContentView();
    this.$el.addClass(this.model.getContentClasses());
    this.addView(view);

    view.bind('customEvent', this._onCustomEvent, this);
    view.bind('close', this._onClose, this);

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
    // 'remove' would be a better name ofc, but there is already an internal method with that name in CoreView
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

  _onClose: function () {
    this.destroy();
  },

  _onCustomEvent: function (customEventName) {
    this.destroy();
    this.trigger('customEvent', customEventName, this);
  },

  _onDestroy: function () {
    this.hide();
    _.invoke(this._subviews, 'allOff');
    this._delayDueToAnimation(function () {
      this.clean();
    });
  },

  _delayDueToAnimation: function (fn) {
    setTimeout(fn.bind(this), CLOSE_DELAY_MS);
  }
});
