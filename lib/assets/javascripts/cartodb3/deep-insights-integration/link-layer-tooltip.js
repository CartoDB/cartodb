module.exports = function linkLayerTooltip (layerDef, visMap) {
  if (!layerDef.tooltipModel) return;

  function onChange (tooltipModel) {
    var attrs = JSON.parse(JSON.stringify(tooltipModel.attributes));

    visMap.getLayerById(layerDef.id).tooltip.update(attrs);
  }

  var tooltipModel = layerDef.tooltipModel;
  if (tooltipModel.get('template_name')) {
    tooltipModel.setTemplate(tooltipModel.get('template_name'));
  }

  tooltipModel.bind('change', onChange);

  layerDef.bind('destroy', function () {
    tooltipModel.unbind('change', onChange);
  });
};
