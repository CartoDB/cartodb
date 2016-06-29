var fs = require('fs');
var INFOWINDOW_NONE = fs.readFileSync(__dirname + '/../mustache-templates/infowindows/infowindow_none.jst.mustache', 'utf8');

module.exports = function linkLayerInfowindow (layerDef, visMap) {
  if (!layerDef.infowindowModel) return;

  function updateInfowindow (infowindowModel) {
    var attrs = JSON.parse(JSON.stringify(infowindowModel.attributes));

    if (infowindowModel.isEmptyTemplate()) {
      var node = layerDef.getAnalysisDefinitionNodeModel();

      var cartdb_id = node && node.querySchemaModel.columnsCollection.find(function (m) {
        return m.get('name') === 'cartodb_id';
      });

      if (cartdb_id) {
        attrs.fields = [{
          name: 'cartodb_id',
          title: true,
          position: 0
        }];
        attrs.template = INFOWINDOW_NONE;
      }
    }

    var infowindow = visMap.getLayerById(layerDef.id).infowindow;
    // some layers like basemaps, torque, or aggregated don't have infowindows so skip update
    if (infowindow) {
      infowindow.update(attrs);
    }
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
