var NotifierView = require('./notifier-view');
var NotifierCollection = require('./notifier-collection');
var _ = require('underscore');

var manager = (function () {
  var $view;
  var notifierView;
  var collection = new NotifierCollection();

  function init (opts) {
    var options = _.extend(opts, {
      collection: collection
    });
    notifierView = new NotifierView(options);

    return notifierView;
  }

  return {
    getView: function (opts) {
      if (!$view) $view = init(opts);
      return $view;
    },

    getCollection: function () {
      return collection;
    },

    addNotification: function (view) {
      collection.add(view);
    },

    removeNotification: function (view) {
      collection.remove(view);
    }
  };
})();

module.exports = manager;
