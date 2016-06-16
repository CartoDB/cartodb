var BasemapLayerViewBase = require('./basemap-layer-view-base');
var template = require('./image-thumbnail-layer.tpl');

module.exports = BasemapLayerViewBase.extend({
  _getCompiledTemplate: function () {
    var desc = _t('editor.layers.basemap.title-label');
    var title = this.model.getName() || desc;

    var imgURL = this.model.get('urlTemplate')
      .replace('{s}', 'a')
      .replace('{z}', 6)
      .replace('{x}', 30)
      .replace('{y}', 24);

    return template({
      title: title,
      desc: title === desc ? '' : desc,
      imgURL: imgURL
    });
  }
});
