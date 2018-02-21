const $ = require('jquery');
const CoreView = require('backbone/core-view');
const template = require('./user-notification.tpl');
const checkAndBuildOpts = require('../../../builder/helpers/required-opts');

const DASHBOARD_NOTIFICATION_KEY = 'builder_activated';
const REQUIRED_OPTS = [
  'notification'
];

module.exports = CoreView.extend({
  className: 'js-builderNotification',

  events: {
    'click .js-close': '_onClose'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

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
  }
});
