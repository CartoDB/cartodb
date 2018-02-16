var _ = require('underscore');
var CoreView = require('backbone/core-view');
var template = require('./modal.tpl');

// Ought to match the duration of the .Dialog.is-closing animation.
var CLOSE_DELAY_MS = 120;

module.exports = CoreView.extend({
  className: function () {
    var classes = ['Dialog', 'is-white'];
    if (!this.options.escapeOptionsDisabled) {
      classes.push('is-opening');
    }

    if (this.options.breadcrumbsEnabled) {
      classes.push('Dialog--withBreadcrumbs');
    }

    return classes.join(' ');
  },

  events: {
    'click .js-close': '_onClose'
  },

  initialize: function () {
    this.listenTo(this.model, 'change:show', this._onShowChange);
    this.listenTo(this.model, 'destroy', this._onDestroy);

    this._escapeOptionsDisabled = this.options.escapeOptionsDisabled;
    this._breadcrumbsEnabled = this.options.breadcrumbsEnabled;
    this._keepOpenOnRouteChange = this.options.keepOpenOnRouteChange;
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(
      template({
        escapeOptionsDisabled: this._escapeOptionsDisabled || false,
        breadcrumbsEnabled: this._breadcrumbsEnabled || false
      })
    );

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
    // 'remove' would be a better name ofc, but there is already an internal method with that name in CoreView
    this.model.destroy();
  },

  keepOpenOnRouteChange: function () {
    return this.model.get('keepOpenOnRouteChange');
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

  _onClose: function (e) {
    e.stopPropagation();
    this.destroy();
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
