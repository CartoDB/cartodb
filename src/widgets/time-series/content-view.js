var _ = require('underscore');
var cdb = require('cartodb.js');
var placeholderTemplate = require('./placeholder.tpl');
var HistogramView = require('./histogram-view');

/**
 * Widget content view for a time-series
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-body CDB-Widget-body--timeSeries',

  initialize: function () {
    this._dataviewModel = this.model.dataviewModel;
    this._initBinds();
  },

  _initBinds: function () {
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

  _appendView: function (view) {
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _isDataEmpty: function () {
    var data = this._dataviewModel.getData();
    return _.isEmpty(data) || _.size(data) === 0;
  },

  _onFirstLoad: function () {
    this.render();
    this._dataviewModel.fetch(); // do an explicit fetch again, to get actual data with the filters applied (e.g. bbox)
  }
});
