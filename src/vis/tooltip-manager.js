var Tooltip = require('../geo/ui/tooltip');

var TooltipManager = function (options) {
  this._vis = options.vis;
  this._map = options.map;
  this._mapView = options.mapView;

  this._map.layers.bind('reset', function (layers) {
    layers.each(this._addTooltipForLayer, this);
  }, this);
  this._map.layers.bind('add', this._addTooltipForLayer, this);
};

TooltipManager.prototype._addTooltipForLayer = function (layerModel) {
  if (layerModel.getTooltipData && layerModel.getTooltipData()) {
    var layerView = this._mapView.getLayerViewByLayerCid(layerModel.cid);

    this._addTooltipOverlay(layerView, layerModel);
    this._bindFeatureOverEvent(layerView, layerModel);
  }
};

TooltipManager.prototype._addTooltipOverlay = function (layerView, layerModel) {
  var tooltipView = layerView.tooltipView;
  if (!tooltipView) {
    var tooltipData = layerModel.getTooltipData();
    layerView.tooltipView = tooltipView = new Tooltip({
      mapView: this._mapView,
      layer: layerView,
      template: tooltipData.template,
      position: 'bottom|right',
      vertical_offset: 10,
      horizontal_offset: 4,
      fields: tooltipData.fields,
      omit_columns: ['cartodb_id']
    });
    this._mapView.addOverlay(tooltipView);

    // TODO: Test this
    layerView.bind('remove', function () {
      tooltipView.clean();
    });
  }
};

TooltipManager.prototype._bindFeatureOverEvent = function (layerView, layerModel) {
  var tooltipView = layerView.tooltipView;
  layerView.bind('featureOver', function (e, latlng, pos, data, layer) {
    var tooltipData = layerModel.getTooltipData();
    if (tooltipData) {
      tooltipView.setTemplate(tooltipData.template);
      tooltipView.setFields(tooltipData.fields);
      tooltipView.setAlternativeNames(tooltipData.alternative_names);
      tooltipView.enable();
    } else {
      tooltipView.disable();
    }
  });
};

module.exports = TooltipManager;
