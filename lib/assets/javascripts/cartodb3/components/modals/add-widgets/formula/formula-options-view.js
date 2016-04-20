var cdb = require('cartodb.js');
var FormulaOptionView = require('./formula-option-view.js');

/**
 * View to select formula widget options
 */
module.exports = cdb.core.View.extend({

  className: 'WidgetList',

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.collection
      .chain()
      .filter(this._isFormula)
      .each(this._renderOption, this);
    return this;
  },

  _renderOption: function (m) {
    var view = new FormulaOptionView({
      className: 'ModalBlockList-item',
      model: m
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _isFormula: function (m) {
    return m.get('type') === 'formula';
  }

});
