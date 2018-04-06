var _ = require('underscore');

module.exports = function linkLayerInfowindow (layerDefinitionModel, infowindowModel, visMap) {
  if (!infowindowModel) return;

  function updateInfowindow (attrs) {
    if (infowindowModel.isEmptyTemplate()) {
      var node = layerDefinitionModel.getAnalysisDefinitionNodeModel();

      var cartodb_id = node && node.querySchemaModel.columnsCollection.find(function (model) {
        return model.get('name') === 'cartodb_id';
      });

      if (cartodb_id) {
        attrs.fields = [{
          name: 'cartodb_id',
          title: true,
          position: 0
        }];

        attrs.template = null;
      }
    }

    infowindowModel.set(attrs);
  }

  function onChange (layerModel) {
    var hasInfowindow = !!visMap.getLayerById(layerDefinitionModel.id).infowindow;

    if (hasInfowindow) {
      updateInfowindow(layerModel.get('infowindow'));
    }
  }

  layerDefinitionModel.bind('change', onChange);

  layerDefinitionModel.bind('destroy', function () {
    layerDefinitionModel.unbind('change', onChange);
  });
};
