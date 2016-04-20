var cdb = require('cartodb.js');
var TimeSeriesOptionView = require('./time-series-option-view.js');
var TimeSeriesNoneOptionView = require('./time-series-none-option-view.js');

/**
 * View to select time-series widget options
 */
module.exports = cdb.core.View.extend({

  className: 'WidgetList',

  initialize: function () {
    this.listenTo(this.collection, 'change:selected', this._onSelectedChange);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.collection
      .chain()
      .filter(this._isTimeSeries)
      .each(this._renderOption, this);
    return this;
  },

  _renderOption: function (m) {
    var ViewClass = m.has('tuples')
      ? TimeSeriesOptionView
      : TimeSeriesNoneOptionView;

    var view = new ViewClass({
      className: 'ModalBlockList-item',
      model: m
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _isTimeSeries: function (m) {
    return m.get('type') === 'time-series';
  },

  _onSelectedChange: function (selectedModel, isSelected) {
    // Make sure there can only be one selected time-series widget option
    if (isSelected) {
      this.collection.each(function (m) {
        if (this._isTimeSeries(m) && m !== selectedModel) {
          m.set('selected', false);
        }
      }, this);
    }
  }

});
