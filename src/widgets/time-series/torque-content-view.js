var _ = require('underscore');
var cdb = require('cartodb.js');
var torqueTemplate = require('./torque-template.tpl');
var placeholderTemplate = require('./placeholder.tpl');
var TorqueHistogramView = require('./torque-histogram-view');
var TorqueHeaderView = require('./torque-header-view');

/**
 * Widget content view for a Torque time-series
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-body CDB-Widget-body--timeSeries',

  initialize: function () {
    this._dataviewModel = this.model.dataviewModel;
    this._dataviewModel.once('change:data', this._onFirstDataChange, this);
    this.add_related_model(this._dataviewModel);
  },

  render: function () {
    this.clearSubViews();

    if (this._isDataEmpty()) {
      this.$el.html(placeholderTemplate({
        hasTorqueLayer: true
      }));
    } else {
      this.$el.html(torqueTemplate());

      var torqueLayerModel = this._dataviewModel.layer;

      this._appendView(
        new TorqueHeaderView({
          el: this.$('.js-header'),
          dataviewModel: this._dataviewModel,
          torqueLayerModel: torqueLayerModel
        })
      );

      var view = new TorqueHistogramView({
        dataviewModel: this._dataviewModel,
        rangeFilter: this._dataviewModel.filter,
        torqueLayerModel: torqueLayerModel
      });
      this._appendView(view);
      this.$el.append(view.el);
    }

    return this;
  },

  _appendView: function (view) {
    this.addView(view);
    view.render();
  },

  _isDataEmpty: function () {
    var data = this._dataviewModel.getData();
    return _.isEmpty(data) || _.size(data) === 0;
  },

  _onFirstDataChange: function () {
    this.render();
    this._dataviewModel.fetch(); // do an explicit fetch again, to get actual data with the filters applied (e.g. bbox)
  }
});
