var log = require('cdb.log');

/**
 * defines the container for an overlay.
 * It places the overlay
 */
var Overlay = {

  _types: {},

  // register a type to be created
  register: function(type, creatorFn) {
    Overlay._types[type] = creatorFn;
  },

  // create a type given the data
  // raise an exception if the type does not exist
  create: function(type, vis, data) {
    var t = Overlay._types[type];

    if (!t) {
      log.error("Overlay: " + type + " does not exist");
      return;
    }

    data.options = typeof data.options === 'string' ? JSON.parse(data.options): data.options;
    data.options = data.options || {}
    var widget = t(data, vis);

    if (widget) {
      widget.type = type;
      return widget;
    }

    return false;
  }
};

module.exports = Overlay;
