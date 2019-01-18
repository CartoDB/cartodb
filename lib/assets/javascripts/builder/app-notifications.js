var Backbone = require('backbone');

var AppNotificationsCollection = Backbone.Collection.extend({
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

var AppNotifications = (function () {
  var initialized = false; // eslint-disable-line
  var collection = new AppNotificationsCollection();

  function init (opts) {
    initialized = true;
  }

  return {
    init: function (opts) {
      init(opts);
      // Types that won't be returned even if present in the collection
      this.mutedTypes = {};
    },

    // For testing porposes only
    off: function () {
      if (__ENV__ === 'test') {
        collection.reset();
        initialized = false;
      }
    },

    getByType: function (type) {
      if (this.mutedTypes.hasOwnProperty(type)) {
        return null;
      }

      return collection.findByType(type);
    },

    getCollection: function () {
      return collection;
    },

    getNotification: function (model) {
      return collection.get(model);
    },

    addNotification: function (attrs) {
      var notification = this.getByType(attrs.type);
      return notification || collection.add(attrs);
    },

    removeNotification: function (model) {
      var notification = this.getNotification(model);
      return collection.remove(notification);
    },

    removeByType: function (type) {
      var model = this.getByType(type);
      return this.removeNotification(model);
    },

    muteByType: function (type) {
      this.mutedTypes[type] = true;
    },

    unmuteByType: function (type) {
      delete this.mutedTypes[type];
    }
  };
})();

module.exports = AppNotifications;
