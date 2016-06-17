var fs = require('fs');
var INFOWINDOW_NONE = fs.readFileSync(__dirname + '/mustache-templates/infowindows/infowindow_none.jst.mustache', 'utf8');

function InfowindowLink (layerDef, visMap) {
  if (!layerDef.infowindowModel) return;

  function updateInfowindow (infowindowModel) {
    var attrs = JSON.parse(JSON.stringify(infowindowModel.attributes));

    if (infowindowModel.isEmptyTemplate()) {
      attrs.fields = [{
        name: 'cartodb_id',
        title: true,
        position: 0
      }];

      attrs.template = INFOWINDOW_NONE;
    }

    visMap.getLayerById(layerDef.id).infowindow && visMap.getLayerById(layerDef.id).infowindow.update(attrs);
  }

  function onChange (infowindowModel) {
    updateInfowindow(infowindowModel);
  }

  layerDef.id && updateInfowindow(layerDef.infowindowModel);

  layerDef.infowindowModel.bind('change', onChange);

  layerDef.bind('destroy', function () {
    layerDef.infowindowModel.unbind('change', onChange);
  });
}

function TooltipLink (layerDef, visMap) {
  if (!layerDef.tooltipModel) return;

  function onChange (tooltipModel) {
    var attrs = JSON.parse(JSON.stringify(tooltipModel.attributes));

    visMap.getLayerById(layerDef.id).tooltip && visMap.getLayerById(layerDef.id).tooltip.update(attrs);
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
