var NotifierView = require('./notifier-view');
var NotifierCollection = require('./notifier-collection');

var manager = (function () {
  var initialized = false;
  var notifierView;
  var collection = new NotifierCollection();
  var editorModel;

  function init (opts) {
    if (!editorModel && !opts) {
      throw new Error('editorModel is required');
    }

    if (!editorModel && opts && opts.editorModel) {
      editorModel = opts.editorModel;
    }

    initialized = true;
    notifierView = new NotifierView({
      collection: collection,
      editorModel: editorModel
    });
  }

  return {
    init: function (opts) {
      init(opts);
    },

    getView: function () {
      if (!initialized) init();
      return notifierView;
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
