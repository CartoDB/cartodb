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
    notifierView.render();
  }

  return {
    DEFAULT_DELAY: 5000,
    init: function (opts) {
      if (opts.visDefinitionModel) {
        this._visDefinitionModel = opts.visDefinitionModel;
      }
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
        notification = collection.findById(model);
      } else {
        notification = collection.findById(model.id);
      }
      return notification;
    },

    addNotification: function (attrs) {
      return collection.add(attrs, {
        visDefinitionModel: this._visDefinitionModel,
        delay: this.DEFAULT_DELAY
      });
    },

    removeNotification: function (model) {
      var notification;
      if (typeof model === 'string') {
        notification = collection.findById(model);
      } else {
        notification = collection.findById(model.id);
      }
      return collection.remove(notification);
    }
  };
})();

module.exports = manager;
