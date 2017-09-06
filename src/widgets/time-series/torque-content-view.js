var _ = require('underscore');
var cdb = require('cartodb.js');
var torqueTemplate = require('./torque-template.tpl');
var placeholderTemplate = require('./placeholder.tpl');
var TorqueHistogramView = require('./torque-histogram-view');
var TorqueHeaderView = require('./torque-header-view');
var DropdownView = require('../dropdown/widget-dropdown-view');
var layerColors = require('../../util/layer-colors');
var analyses = require('../../data/analyses');
var escapeHTML = require('../../util/escape-html');

/**
 * Widget content view for a Torque time-series
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-body CDB-Widget-body--timeSeries',

  initialize: function () {
    this._dataviewModel = this.model.dataviewModel;
    this._originalData = this._dataviewModel.getUnfilteredDataModel();
    this._selectedAmount = 0;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    var sourceId = this._dataviewModel.get('source').id;
    var letter = layerColors.letter(sourceId);
    var sourceColor = layerColors.getColorForLetter(letter);
    var sourceType = this._dataviewModel.getSourceType() || '';
    var layerName = this._dataviewModel.getLayerName() || '';

    if (this._isDataEmpty()) {
      this.$el.html(placeholderTemplate({
        hasTorqueLayer: true
      }));
    } else {
      this.$el.html(torqueTemplate({
        sourceId: sourceId,
        sourceType: analyses.title(sourceType),
        showSource: this.model.get('show_source') && letter !== '',
        sourceColor: sourceColor,
        layerName: escapeHTML(layerName)
      }));
      this._createHeaderView();
      this._createTorqueHistogramView();
      this._createDropdownView();
    }

    return this;
  },

  _createHeaderView: function () {
    if (this._headerView) {
      this._headerView.remove();
    }

    this._headerView = new TorqueHeaderView({
      el: this.$('.js-torque-header'),
      dataviewModel: this._dataviewModel,
      torqueLayerModel: this._dataviewModel.layer,
      timeSeriesModel: this.model,
      selectedAmount: this._selectedAmount
    });

    this.addView(this._headerView);
    this._headerView.render();
  },

  _createTorqueHistogramView: function () {
    if (this._histogramView) {
      this._histogramView.remove();
    }

    this._histogramView = new TorqueHistogramView({
      timeSeriesModel: this.model,
      dataviewModel: this._dataviewModel,
      rangeFilter: this._dataviewModel.filter,
      torqueLayerModel: this._dataviewModel.layer,
      displayShadowBars: !this.model.get('normalized'),
      normalized: !!this.model.get('normalized')
    });
    this.addView(this._histogramView);
    this.$el.append(this._histogramView.render().el);
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
        normalizeHistogram: !!this.model.get('normalized'),
        canCollapse: false
      }
    });
    this.addView(this._dropdownView);
  },

  _initBinds: function () {
    this.listenTo(this._originalData, 'change:data', this._onOriginalDataChange);

    this.listenTo(this._dataviewModel, 'change:data', this.render);
    this.listenTo(this._dataviewModel, 'change:bins', this._onChangeBins);

    this.listenTo(this._dataviewModel.layer, 'change:layer_name', this.render);
    this.add_related_model(this._dataviewModel.layer);
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
