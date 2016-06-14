module.exports = function linkLayerTooltip (layerDef, visMap) {
  if (!layerDef.tooltipModel) return;

  function onChange (tooltipModel) {
    var attrs = JSON.parse(JSON.stringify(tooltipModel.attributes));

    visMap.getLayerById(layerDef.id).tooltip.update(attrs);
  }

  layerDef.tooltipModel.bind('change', onChange);

  layerDef.bind('destroy', function () {
    layerDef.tooltipModel.unbind('change', onChange);
  });
}
