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
    DEFAULT_DELAY: 5000,
    init: function (opts) {
      if (opts.visDefinitionModel) {
        this._visDefinitionModel = opts.visDefinitionModel;
      }
      init(opts);
    },

    // For testing porposes only
    off: function () {
      if (__ENV__ === 'test') {
        collection.reset();
        initialized = false;
        notifierView.remove();
        notifierView = null;
      }
    },

    getView: function () {
      if (!initialized) init();
      return notifierView.rebindEvents();
    },

    getCollection: function () {
      return collection;
    },

    getCount: function () {
      return collection.size();
    },

    getNotification: function (model) {
      return typeof model === 'string'
        ? collection.findById(model)
        : collection.findById(model.id);
    },

    addNotification: function (attrs) {
      return collection.addNotification(attrs, {
        visDefinitionModel: this._visDefinitionModel,
        delay: this.DEFAULT_DELAY
      });
    },

    removeNotification: function (model) {
      var notification = typeof model === 'string'
        ? collection.findById(model)
        : collection.findById(model.id);

      return collection.remove(notification);
    }
  };
})();

module.exports = manager;
