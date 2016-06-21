var BaseLayerViewBase = require('./base-layer-view-base');
var template = require('./image-thumbnail-layer.tpl');

module.exports = BaseLayerViewBase.extend({
  _getCompiledTemplate: function () {
    var title = this.model.getName();
    var desc = _t('editor.layers.basemap.title-label');

    return template({
      title: title,
      desc: title === desc ? '' : desc,
      imgURL: this._getImageURL()
    });
  },

  _getImageURL: function () {
    // WMS layers
    if (this.model.get('proxy')) {
      // TODO: Add icon for WMS basemaps
      return '';
    }
    return this.model.get('urlTemplate')
      .replace('{s}', 'a')
      .replace('{z}', 6)
      .replace('{x}', 30)
      .replace('{y}', 24);
  }
});
