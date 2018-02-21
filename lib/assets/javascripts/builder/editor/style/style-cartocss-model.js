var Backbone = require('backbone');
var UndoManager = require('builder/data/undo-manager.js');
var _ = require('underscore');

/**
 *  CartoCSS Undo-redo model
 */
module.exports = Backbone.Model.extend({

  defaults: {
    content: ''
  },

  initialize: function (attrs, opts) {
    this._history = this._generateHistory(opts && opts.history);

    UndoManager.init(this, {
      track: true,
      history: this._history
    });
  },

  _generateHistory: function (history) {
    if (history && history.length) {
      var data = _.reduce(history, function (memo, cartocss) {
        memo.push({
          content: cartocss
        });
        return memo;
      }, [], this);
      return data;
    }

    return false;
  },

  getHistory: function () {
    return _.pluck(
      this.getUndoHistory(),
      'content'
    );
  }
});
