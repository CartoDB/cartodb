var infowindowNoneTemplate = require('builder/mustache-templates/infowindows/infowindow_none.tpl');

module.exports = function linkLayerInfowindow (layerDef, visMap) {
  if (!layerDef.infowindowModel) return;

  function updateInfowindow (infowindowModel) {
    var attrs = JSON.parse(JSON.stringify(infowindowModel.attributes));

    if (infowindowModel.isEmptyTemplate()) {
      var node = layerDef.getAnalysisDefinitionNodeModel();

      var cartodb_id = node && node.querySchemaModel.columnsCollection.find(function (m) {
        return m.get('name') === 'cartodb_id';
      });

      if (cartodb_id) {
        attrs.fields = [{
          name: 'cartodb_id',
          title: true,
          position: 0
        }];

        attrs.template = infowindowNoneTemplate({
          title: _t('editor.layers.infowindow.no-fields'),
          subtitle: _t('editor.layers.infowindow.select-fields')
        });
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
