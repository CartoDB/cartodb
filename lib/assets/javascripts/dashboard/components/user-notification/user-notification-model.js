var Backbone = require('backbone');
const checkAndBuildOpts = require('../../../builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'key',
  'configModel'
];

module.exports = Backbone.Model.extend({
  sync: function (method, model, options) {
    return Backbone.sync('update', model, options);
  },

  url: function () {
    return `${this._configModel.get('url_prefix')}/api/v3/notifications/${this.get('key')}`;
  },

  initialize: function (attrs, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.attributes = { notifications: attrs, key: this._key };
  },

  getKey: function (key) {
    const notifications = this.get('notifications') || {};

    return notifications[key];
  },

  setKey: function (key, value) {
    const notifications = this.get('notifications');

    this.set('notifications', { ...notifications, [key]: value });
  }
});
