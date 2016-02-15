var cdb = require('cartodb.js');
var FormulaItemView = require('./add-widgets-formula-option-view');

/**
 * View to select formula widget options
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.collection) throw new Error('collection is required');
  },

  render: function () {
    this.collection
      .chain()
      .filter(this._isFormulaType)
      .each(this._createItemView, this);
    return this;
  },

  _createItemView: function (m) {
    var view = new FormulaItemView({
      model: m
    });
    this.addView(view);
    view.render();
  },

  _isFormulaType: function (m) {
    return m.get('type') === 'formula';
  }
});
