var cdb = require('cartodb.js');
var UndoManager = require('../../data/undo-manager.js');
// var _ = require('underscore');

/**
 *  CartoCSS Undo-redo model
 */
module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    var history = this.options.history;

    UndoManager.init(this, { track: true });
  }
});
