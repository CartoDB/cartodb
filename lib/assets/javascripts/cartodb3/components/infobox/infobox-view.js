var cdb = require('cartodb.js');
var template = require('./infobox.tpl');
var templateButton = require('./infobox-button.tpl');

// Duration of the .Infobox.is-closing animation.
var CLOSE_DELAY_MS = 120;

module.exports = cdb.core.View.extend({
  events: {
    'click .js-primary .js-action': '_onPrimaryClick',
    'click .js-secondary .js-action': '_onSecondaryClick'
  },

  initialize: function (opts) {
    if (!opts.model) throw new Error('model is required');

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  toggle: function (m, isVisible) {
    isVisible ? this._show() : this._hide();
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:show', this.toggle);
  },

  _initViews: function () {
    var $el = template({
      type: this.model.type(),
      title: this.model.title(),
      body: this.model.body()
    });

    this.setElement($el);

    if (this.model.primaryButton() !== false) {
      this._primaryButton().html(templateButton(this.model.primaryButton()));
    }

    if (this.model.secondaryButton() !== false) {
      this._secondaryButton().html(templateButton(this.model.secondaryButton()));
    }
  },

  _onPrimaryClick: function () {
    this.model.primaryAction();
  },

  _onSecondaryClick: function () {
    this.model.secondaryAction();
  },

  _primaryButton: function () {
    return this.$('.js-primary');
  },

  _secondaryButton: function () {
    return this.$('.js-secondary');
  },

  _hide: function () {
    this.$el.hide();
    this._delayDueToAnimation(function () {
      this.clean();
    });
  },

  _show: function () {
    this.$el.show();
    this._delayDueToAnimation(function () {
      this.clean();
    });
  },

  _delayDueToAnimation: function (fn) {
    setTimeout(fn.bind(this), CLOSE_DELAY_MS);
  }
});
