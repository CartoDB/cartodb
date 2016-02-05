var _ = require('underscore');
var WidgetContentView = require('../standard/widget-content-view');
var placeholderTemplate = require('./placeholder.tpl');
var HistogramView = require('./histogram-view');

/**
 * Widget content view for a time-series
 */
module.exports = WidgetContentView.extend({
  className: 'CDB-Widget-body CDB-Widget-body--timeSeries',

  _initBinds: function () {
    this._dataviewModel = this.model.dataviewModel;
    this._dataviewModel.once('change:data', this._onFirstLoad, this);
    this._dataviewModel.once('error', function () {
      alert('the tiler does not support non-torque layers just yet…');
    });
    this.add_related_model(this._dataviewModel);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(''); // to remove placeholder if there is any

    if (this._isDataEmpty()) {
      this.$el.append(placeholderTemplate({
        hasTorqueLayer: false
      }));
    } else {
      this._appendView(new HistogramView({
        model: this._dataviewModel,
        rangeFilter: this._dataviewModel.filter,
        torqueLayerModel: this._dataviewModel.layer
      }));
    }

    return this;
  },

  _onFirstLoad: function () {
    this._storeBounds();
    this._dataviewModel.once('change:data', this.render, this);
    this._dataviewModel._fetch();
    if (!this._isDataEmpty()) {
      this.render();
    }
  },

  _storeBounds: function () {
    var data = this._dataviewModel.getData();
    if (data && data.length > 0) {
      var start = data[0].start;
      var end = data[data.length - 1].end;
      this._dataviewModel.set({ start: start, end: end, bins: data.length });
    }
  },

  _appendView: function (view) {
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _isDataEmpty: function () {
    var data = this._dataviewModel.getData();
    return _.isEmpty(data) || _.size(data) === 0;
  }
});
