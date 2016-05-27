function InfowindowLink (layerDef, visMap) {
  if (!layerDef.infowindowModel) return;

  function onChange (attrs) {
    visMap.getLayerById(layerDef.id).infowindow.update(attrs.toJSON());
  }

  layerDef.infowindowModel.bind('change', onChange);

  layerDef.bind('destroy', function () {
    layerDef.infowindowModel.unbind('change', onChange);
  });
}

function TooltipLink (layerDef, visMap) {
  if (!layerDef.tooltipModel) return;

  function onChange (attrs) {
    visMap.getLayerById(layerDef.id).tooltip.update(attrs.toJSON());
  }

  layerDef.tooltipModel.bind('change', onChange);

  layerDef.bind('destroy', function () {
    layerDef.tooltipModel.unbind('change', onChange);
  });
}

function InfowindowManager (opts) {
  opts.layerDefinitionsCollection.on('add', function (layerDef) {
    InfowindowLink(layerDef, opts.visMap);
    TooltipLink(layerDef, opts.visMap);
  });

  function update () {
    opts.layerDefinitionsCollection.each(function (layerDef) {
      InfowindowLink(layerDef, opts.visMap);
      TooltipLink(layerDef, opts.visMap);
    });
  }

  this.initBinds = update.bind(this);

  opts.layerDefinitionsCollection.on('reset', update);
}

module.exports = InfowindowManager;
