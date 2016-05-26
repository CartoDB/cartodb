var cdb = require('cartodb.js');
var UndoManager = require('../../data/undo-manager.js');
// var _ = require('underscore');

/**
 *  CartoCSS Undo-redo model
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    content: ''
  },

  initialize: function (attrs, opts) {
    var history = opts && opts.history;

    UndoManager.init(this, { track: true });
  },

  getHistory: function () {
    return [];
  }
});
