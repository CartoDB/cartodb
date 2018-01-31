var CoreView = require('backbone/core-view');
var $ = require('jquery');
var template = require('./builder-activated-notification.tpl');
var DASHBOARD_NOTIFICATION_KEY = 'builder_activated';

module.exports = CoreView.extend({
  className: 'js-builderNotification',
  events: {
    'click .js-close': '_onClose'
  },

  initialize: function () {
    if (!this.options.builderActivatedNotification) { throw new Error('builderActivatedNotification is required'); }
    this._notification = this.options.builderActivatedNotification;

    this.render();
  },

  render: function () {
    this.$el.html(template());
    $('body').prepend(this.$el);

    return this;
  },

  _onClose: function () {
    this._notification.setKey(DASHBOARD_NOTIFICATION_KEY, true);
    this._notification.save();

    this.clean();
  },

  clean: function () {
    this.constructor.__super__.clean.apply(this);
  }
});
