var NotifierView = require('./notifier-view');
var NotifierCollection = require('./notifier-collection');

var manager = (function () {
  var $view;
  var notifierView;
  var collection = new NotifierCollection();

  function init () {
    notifierView = new NotifierView({
      collection: collection
    });

    return notifierView;
  }

  return {
    init: function () {
      init();
    },

    getView: function () {
      if (!$view) $view = init();
      return $view;
    },

    getCollection: function () {
      return collection;
    },

    getNotification: function (model) {
      var notification;
      if (typeof model === 'string') {
        notification = collection.search(model);
      } else {
        notification = collection.search(model.id);
      }
      return notification;
    },

    addNotification: function (model) {
      return collection.add(model);
    },

    removeNotification: function (model) {
      var notification;
      if (typeof model === 'string') {
        notification = collection.search(model);
      } else {
        notification = collection.search(model.id);
      }
      return collection.remove(notification);
    }
  };
})();

module.exports = manager;
