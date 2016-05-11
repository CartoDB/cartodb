var StyleGenerator = require('./style-converter');
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
    function _bind () {
      function _generate (layerDef) {
        return function () { self.generate(layerDef); };
      }
      this.layerDefinitionsCollection.each(function (layerDef) {
        // base layers don't have styles
        if (layerDef._styleModel) {
          layerDef._styleModel.bind('change', _generate(layerDef), self);
        }
      });
    }
    this.layerDefinitionsCollection.bind('reset', _bind, this);
    _bind.call(this);
  },

  generate: function (layerDef) {
    // TODO: geometryType
    var generated = StyleGenerator.generateStyle(layerDef._styleModel.toJSON(), 'point');
    layerDef.set({
      cartocss: generated.cartoCSS,
      //query_wrapper: generated.sql
      sql_wrap: generated.sql
    });
  }
};

module.exports = StyleManager;
