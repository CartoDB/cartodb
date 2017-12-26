var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');
var DASHBOARD_NOTIFICATION_KEY = 'builder_activated';

module.exports = cdb.core.View.extend({
  className: 'js-builderNotification',
  events: {
    'click .js-close': '_onClose'
  },

  initialize: function () {
    if (!this.options.notification) { throw new Error('notification is required'); }

    this._notification = this.options.notification;
    this._template = cdb.templates.getTemplate('common/user_notification/user_notification');

    this.render();
  },

  render: function () {
    this.$el.html(this._template());

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
