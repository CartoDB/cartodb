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
    getView: function () {
      if (!$view) $view = init();
      return $view;
    },

    getCollection: function () {
      return collection;
    },

    addNotice: function (view) {
      collection.add(view);
    },

    removeNotice: function (view) {
      collection.remove(view);
    }
  };
})();

module.exports = manager;
