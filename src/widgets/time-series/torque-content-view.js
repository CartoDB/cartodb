var _ = require('underscore');
var cdb = require('cartodb.js');
var torqueTemplate = require('./torque-template.tpl');
var placeholderTemplate = require('./placeholder.tpl');
var TorqueHistogramView = require('./torque-histogram-view');
var TorqueHeaderView = require('./torque-header-view');
var DropdownView = require('../dropdown/widget-dropdown-view');

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

    if (this._isDataEmpty()) {
      this.$el.html(placeholderTemplate({
        hasTorqueLayer: true
      }));
    } else {
      this.$el.html(torqueTemplate());
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
      model: this._dataviewModel,
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
        normalizeHistogram: !!this.model.get('normalized'),
        canCollapse: false
      }
    });
    this.addView(this._dropdownView);
  },

  _initBinds: function () {
    this._originalData.once('change:data', this._onOriginalDataChange, this);
    this.add_related_model(this._originalData);

    this._dataviewModel.once('change:data', this.render, this);
    this._dataviewModel.bind('change:bins', this._onChangeBins, this);
    this.add_related_model(this._dataviewModel);
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
