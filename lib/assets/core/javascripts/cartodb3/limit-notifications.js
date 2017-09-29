var Backbone = require('backbone');
var _ = require('underscore');

var LimitNotificationsCollection = Backbone.Collection.extend({
  model: function (attrs, opts) {
    return new Backbone.Model(attrs, opts);
  },

  findById: function (id) {
    return this.findWhere({ id: id });
  },

  findByType: function (type) {
    return this.findWhere({ type: type });
  }
});

var LimitNotifications = (function () {
  var initialized = false; // eslint-disable-line
  var collection = new LimitNotificationsCollection();

  function init () {
    initialized = true;
  }

  return {
    init: function (opts) {
      init(opts);
    },

    // For testing porposes only
    off: function () {
      if (__ENV__ === 'test') {
        collection.reset();
        initialized = false;
      }
    },

    getByType: function (type) {
      return collection.findByType(type);
    },

    getCollection: function () {
      return collection;
    },

    getNotification: function (model) {
      var id = _.isString(model) ? model : model.id;
      return collection.findById(id);
    },

    addNotification: function (attrs) {
      var notification = this.getByType(attrs.type);
      return notification || collection.add(attrs);
    },

    removeNotification: function (model) {
      var notification = this.getNotification(model);
      return collection.remove(notification);
    }
  };
})();

module.exports = LimitNotifications;
