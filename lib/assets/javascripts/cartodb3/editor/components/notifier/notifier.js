var Notifier = require('./notifier-view');

var notifierView = new Notifier();

var manager = (function () {
  var $view;

  function init () {
    return notifierView.render().el;
  }

  return {
    getView: function () {
      if (!$view) $view = init();
      return $view;
    },

    addNotice: function (view) {
      notifierView.includeView(view);
    },

    removeNotice: function (view) {
      notifierView.excludeView(view);
    }
  };
})();

module.exports = manager;
