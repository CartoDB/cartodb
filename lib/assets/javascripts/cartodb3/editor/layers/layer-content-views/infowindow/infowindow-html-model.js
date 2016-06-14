var Backbone = require('backbone');
var UndoManager = require('../../../../data/undo-manager.js');
var _ = require('underscore');

/**
 *  Infowindow Undo-redo model
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
      var data = _.reduce(history, function (memo, infowindow_html) {
        memo.push({
          content: infowindow_html
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
