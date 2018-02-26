var CoreView = require('backbone/core-view');
var HistogramOptionView = require('./histogram-option-view.js');

/**
 * View to select histogram widget options
 */
module.exports = CoreView.extend({

  className: 'WidgetList',

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.collection
      .chain()
      .filter(this._isHistogram)
      .each(this._renderOption, this);
    return this;
  },

  _renderOption: function (m) {
    var view = new HistogramOptionView({
      className: 'WidgetList-item js-WidgetList-item',
      model: m
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _isHistogram: function (m) {
    return m.get('type') === 'histogram';
  }

});
