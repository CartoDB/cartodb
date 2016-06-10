var fs = require('fs');
var INFOWINDOW_NONE = fs.readFileSync(__dirname + '/mustache-templates/infowindows/infowindow_none.jst.mustache', 'utf8');

function InfowindowLink (layerDef, visMap) {
  if (!layerDef.infowindowModel) return;

  function updateInfowindow (infowindowModel) {
    var attrs = JSON.parse(JSON.stringify(infowindowModel.attributes));

    if (infowindowModel.fieldCount() === 0 &&
        // 'table/views/infowindow_light' is the default template
        infowindowModel.get('template_name') !== 'table/views/infowindow_light' &&
        // '' is the template set when click None
        infowindowModel.get('template_name') !== '') {
      attrs.fields = [{
        name: 'cartodb_id',
        title: true,
        position: 0
      }];

      attrs.template = INFOWINDOW_NONE;
    }

    visMap.getLayerById(layerDef.id).infowindow.update(attrs);
  }

  function onChange (infowindowModel) {
    updateInfowindow(infowindowModel);
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
