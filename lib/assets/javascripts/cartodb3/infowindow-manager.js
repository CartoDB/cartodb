var fs = require('fs');
var INFOWINDOW_NONE = fs.readFileSync(__dirname + '/mustache-templates/infowindows/infowindow_none.jst.mustache', 'utf8');

function InfowindowLink (layerDef, visMap) {
  if (!layerDef.infowindowModel) return;

  function updateInfowindow (attrs) {
    var jsonAttrs = attrs.toJSON();

    if (attrs.fieldCount() === 0 && attrs.get('template_name') !== '') {
      jsonAttrs.fields = [{
        name: 'cartodb_id',
        title: true,
        position: 0
      }];

      jsonAttrs.template = INFOWINDOW_NONE;
    }

    visMap.getLayerById(layerDef.id).infowindow.update(jsonAttrs);
  }

  function onChange (attrs) {
    updateInfowindow(attrs);
  }

  updateInfowindow(layerDef.infowindowModel);

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
