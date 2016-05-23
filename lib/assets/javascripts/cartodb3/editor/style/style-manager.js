var StyleGenerator = require('./style-converter');
var _ = require('underscore');

/**
 * this class manages the changes in layerdef styles and generate the proper cartocss and sql
 */
function StyleManager (layerDefinitionsCollection) {
  this.layerDefinitionsCollection = layerDefinitionsCollection;
  this._initBinds();
}

StyleManager.prototype = {
  _initBinds: function () {
    var self = this;

    function _generate (layerDef) {
      return function () {
        self.generate(layerDef);
      };
    }

    function _bind (layerDef) {
      if (layerDef && layerDef.styleModel) {
        layerDef.styleModel.bind('change', _generate(layerDef), this);
      }
    }

    function _unbind (layerDef) {
      if (layerDef.styleModel) {
        layerDef.styleModel.unbind(null, null, this);
      }
    }

    function _bindAll () {
      this.layerDefinitionsCollection.each(_bind, this);
    }

    this.layerDefinitionsCollection.bind('reset', _bindAll, this);
    this.layerDefinitionsCollection.bind('add', _bind, this);
    this.layerDefinitionsCollection.bind('remove', _unbind, this);

    _bindAll.call(this);
  },

  generate: function (layerDef) {
    var stylesChanged = layerDef.styleModel.changed;

    if (stylesChanged.type && _.size(stylesChanged) === 1) {
      return;
    }

    var nodeModel = layerDef.getAnalysisDefinitionNodeModel();
    var querySchemaModel = nodeModel.querySchemaModel;
    var geom = querySchemaModel.getGeometry();
    var simpleGeometryType = 'point';
    if (geom) {
      simpleGeometryType = geom.getSimpleType();
    }
    var generated = StyleGenerator.generateStyle(layerDef.styleModel.toJSON(), simpleGeometryType);
    layerDef.set({
      cartocss: generated.cartoCSS,
      sql_wrap: generated.sql,
      type: generated.layerType
    });
  }
};

module.exports = StyleManager;
