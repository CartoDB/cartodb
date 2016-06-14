var fs = require('fs');
var INFOWINDOW_NONE = fs.readFileSync(__dirname + '/../mustache-templates/infowindows/infowindow_none.jst.mustache', 'utf8');

module.exports = function linkLayerInfowindow (layerDef, visMap) {
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
};
