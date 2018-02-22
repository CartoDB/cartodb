var CoreView = require('backbone/core-view');
var FormulaOptionView = require('./formula-option-view.js');

/**
 * View to select formula widget options
 */
module.exports = CoreView.extend({

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
      className: 'WidgetList-item js-WidgetList-item',
      model: m
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _isFormula: function (m) {
    return m.get('type') === 'formula';
  }

});
