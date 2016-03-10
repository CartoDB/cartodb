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
    this._originalData = this.model.dataviewModel.getUnfilteredDataModel();
    this._initBinds();
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

  _initBinds: function () {
    this._originalData.once('change:data', this._onOriginalDataChange, this);
    this._dataviewModel.once('error', function () {
      console.log('the tiler does not support non-torque layers just yet…');
    });
    this._dataviewModel.once('change:data', this.render, this);
    this.add_related_model(this._dataviewModel);
    this.add_related_model(this._originalData);
  },

  _appendView: function (view) {
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _isDataEmpty: function () {
    var data = this._dataviewModel.getData();
    return _.isEmpty(data) || _.size(data) === 0;
  },

  _onOriginalDataChange: function () {
    // do an explicit fetch in order to get actual data
    // with the filters applied (e.g. bbox)
    this._dataviewModel.fetch();
  }
});
