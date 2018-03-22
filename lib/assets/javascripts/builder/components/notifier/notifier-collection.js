var Backbone = require('backbone');
var NotifierModel = require('./notifier-model');

module.exports = Backbone.Collection.extend({
  model: function (attrs, opts) {
    return new NotifierModel(attrs, opts);
  },

  findById: function (id) {
    return this.findWhere({id: id});
  },

  addNotification: function (attrs, options) {
    var notification = this._findNotificationByAttrs(attrs);

    return notification ? notification.update(attrs) : this.add(attrs, options);
  },

  _findNotificationByAttrs: function (attrs) {
    return this.findWhere({ info: attrs.info });
  }
});
