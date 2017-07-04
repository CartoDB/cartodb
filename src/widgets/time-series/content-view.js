var _ = require('underscore');
var cdb = require('cartodb.js');
var placeholderTemplate = require('./placeholder.tpl');
var contentTemplate = require('./content.tpl');
var HistogramView = require('./histogram-view');
var TimeSeriesHeaderView = require('./time-series-header-view');
var DropdownView = require('../dropdown/widget-dropdown-view');

/**
 * Widget content view for a time-series
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-body CDB-Widget-body--timeSeries',

  initialize: function () {
    this._dataviewModel = this.model.dataviewModel;
    this._originalData = this.model.dataviewModel.getUnfilteredDataModel();
    this._selectedAmount = 0;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this._isDataEmpty()) {
      this.$el.append(placeholderTemplate({
        hasTorqueLayer: false
      }));
    } else {
      this.$el.append(contentTemplate());
      this._createHistogramView();
      this._createHeaderView();
      this._createDropdownView();
      this._updateRange();
    }
    return this;
  },

  _initBinds: function () {
    this._originalData.once('change:data', this._onOriginalDataChange, this);
    this._dataviewModel.once('error', function () {
      console.log('the tiler does not support non-torque layers just yet…');
    });
    this._dataviewModel.once('change:data', this.render, this);
    this._dataviewModel.bind('change:bins', this._onChangeBins, this);

    this.add_related_model(this._dataviewModel);
    this.add_related_model(this._originalData);
  },

  _createHistogramView: function () {
    if (this._histogramView) {
      this._histogramView.remove();
    }

    this._histogramView = new HistogramView({
      timeSeriesModel: this.model,
      model: this._dataviewModel,
      rangeFilter: this._dataviewModel.filter,
      displayShadowBars: !this.model.get('normalized'),
      normalized: !!this.model.get('normalized')
    });

    this.addView(this._histogramView);
    this.$('.js-content').append(this._histogramView.render().el);
  },

  _createHeaderView: function () {
    if (this._headerView) {
      this._headerView.remove();
    }

    this._headerView = new TimeSeriesHeaderView({
      dataviewModel: this._dataviewModel,
      rangeFilter: this._dataviewModel.filter,
      timeSeriesModel: this.model,
      showClearButton: true,
      selectedAmount: this._selectedAmount
    });

    if (!this._histogramView) {
      throw new Error('Histogram view must be instantiated before the header view');
    }
    this._headerView.bind('resetFilter', this._histogramView.resetFilter, this._histogramView);
    this.addView(this._headerView);
    this.$('.js-header').append(this._headerView.render().el);
  },

  _createDropdownView: function () {
    if (this._dropdownView) {
      this._dropdownView.remove();
    }

    this._dropdownView = new DropdownView({
      model: this.model,
      target: '.js-actions',
      container: this.$('.js-header'),
      flags: {
        normalizeHistogram: true,
        canCollapse: false
      }
    });

    this.addView(this._dropdownView);
  },

  _updateRange: function () {
    var bars = this._calculateBars();
    var lo = bars.loBarIndex;
    var hi = bars.hiBarIndex;
    if (lo !== 0 || hi !== this._dataviewModel.get('bins')) {
      this._histogramView.selectRange(lo, hi);
    }
  },

  _setRange: function (loBarIndex, hiBarIndex) {
    var data = this._dataviewModel.getData();
    var filter = this._dataviewModel.filter;
    if ((!data || !data.length) || !loBarIndex || !hiBarIndex) {
      return;
    }

    filter.setRange(
      data[loBarIndex].start,
      data[hiBarIndex - 1].end
    );
  },

  _calculateBars: function () {
    var data = this._dataviewModel.getData();
    var min = this.model.get('min');
    var max = this.model.get('max');
    var loBarIndex = this.model.get('lo_index');
    var hiBarIndex = this.model.get('hi_index');
    var startMin;
    var startMax;

    if (data.length > 0) {
      if (!_.isNumber(min) && !_.isNumber(loBarIndex)) {
        loBarIndex = 0;
      } else if (_.isNumber(min) && !_.isNumber(loBarIndex)) {
        startMin = _.findWhere(data, {start: min});
        loBarIndex = startMin && startMin.bin || 0;
      }

      if (!_.isNumber(max) && !_.isNumber(hiBarIndex)) {
        hiBarIndex = data.length;
      } else if (_.isNumber(max) && !_.isNumber(hiBarIndex)) {
        startMax = _.findWhere(data, {end: max});
        hiBarIndex = startMax && startMax.bin + 1 || data.length;
      }
    } else {
      loBarIndex = 0;
      hiBarIndex = data.length;
    }

    return {
      loBarIndex: loBarIndex,
      hiBarIndex: hiBarIndex
    };
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
  },

  _onChangeBins: function (mdl, bins) {
    this._originalData.setBins(bins);
  }
});
