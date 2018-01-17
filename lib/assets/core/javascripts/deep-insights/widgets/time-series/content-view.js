var _ = require('underscore');
var CoreView = require('backbone/core-view');
var placeholderTemplate = require('./placeholder.tpl');
var contentTemplate = require('./content.tpl');
var HistogramView = require('./histogram-view');
var TimeSeriesHeaderView = require('./time-series-header-view');
var DropdownView = require('../dropdown/widget-dropdown-view');
var layerColors = require('../../util/layer-colors');
var analyses = require('../../data/analyses');
var escapeHTML = require('../../util/escape-html');

/**
 * Widget content view for a time-series
 */
module.exports = CoreView.extend({
  className: 'CDB-Widget-body CDB-Widget-body--timeSeries',

  initialize: function () {
    if (!this.model.dataviewModel) throw new Error('dataviewModel is required');
    if (!this.model.layerModel) throw new Error('layerModel is required');

    this._dataviewModel = this.model.dataviewModel;
    this._layerModel = this.model.layerModel;
    this._selectedAmount = 0;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    var sourceId = this._dataviewModel.get('source').id;
    var letter = layerColors.letter(sourceId);
    var sourceColor = layerColors.getColorForLetter(letter);
    var sourceType = this._dataviewModel.getSourceType() || '';
    var isSourceType = this._dataviewModel.isSourceType();
    var layerName = isSourceType
      ? this.model.get('table_name')
      : this._layerModel.get('layer_name');

    if (this._isDataEmpty() || this._hasError()) {
      this.$el.append(placeholderTemplate({
        hasTorqueLayer: false
      }));
    } else {
      this.$el.append(contentTemplate({
        sourceId: sourceId,
        sourceType: analyses.title(sourceType),
        isSourceType: isSourceType,
        showSource: this.model.get('show_source') && letter !== '',
        sourceColor: sourceColor,
        layerName: escapeHTML(layerName)
      }));
      this._createHistogramView();
      this._createHeaderView();
      this._createDropdownView();
      this._updateRange();
    }
    return this;
  },

  _initBinds: function () {
    this._dataviewModel.once('error', function () {
      console.log('the tiler does not support non-torque layers just yet…');
    });

    this.listenTo(this._dataviewModel, 'change:data', this.render);
    this.listenToOnce(this.model, 'change:hasInitialState', this.render);

    this.listenTo(this._layerModel, 'change:layer_name', this.render);
    this.add_related_model(this._layerModel);
  },

  _createHistogramView: function () {
    if (this._histogramView) {
      this._histogramView.remove();
    }

    this._histogramView = new HistogramView({
      timeSeriesModel: this.model,
      dataviewModel: this._dataviewModel,
      layerModel: this._layerModel,
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
      layerModel: this._layerModel,
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
    this.$('.js-title').append(this._headerView.render().el);
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
        localTimezone: this._dataviewModel.getColumnType() === 'date',
        normalizeHistogram: true,
        canCollapse: false
      }
    });

    this.addView(this._dropdownView);
  },

  _updateRange: function () {
    var bars = this._calculateBars();
    var bins = this._dataviewModel.get('bins');
    var lo = Math.max(bars.loBarIndex, 0);
    var hi = Math.min(bars.hiBarIndex, bins);
    if (lo > 0 || hi < bins) {
      this._histogramView.selectRange(lo, hi);
    }
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
        loBarIndex = (startMin && startMin.bin) || 0;
      }

      if (!_.isNumber(max) && !_.isNumber(hiBarIndex)) {
        hiBarIndex = data.length;
      } else if (_.isNumber(max) && !_.isNumber(hiBarIndex)) {
        startMax = _.findWhere(data, {end: max});
        hiBarIndex = (startMax && startMax.bin + 1) || data.length;
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
    var data = this._dataviewModel.getUnfilteredData();
    return _.isEmpty(data) || _.size(data) === 0;
  },

  _hasError: function () {
    return this._dataviewModel.has('error');
  }
});
