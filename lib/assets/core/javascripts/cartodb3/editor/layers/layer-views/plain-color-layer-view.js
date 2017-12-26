var BaseLayerViewBase = require('./base-layer-view-base');
var template = require('./plain-color-layer.tpl');

module.exports = BaseLayerViewBase.extend({
  _getCompiledTemplate: function () {
    var desc = _t('editor.layers.color.title-label');
    var title = this.model.get('color') || desc;

    return template({
      title: title,
      desc: title === desc ? '' : desc,
      color: this.model.get('color')
    });
  }
});
