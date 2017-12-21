var _ = require('underscore');
var BaseLayerViewBase = require('./base-layer-view-base');
var template = require('./image-thumbnail-layer.tpl');

module.exports = BaseLayerViewBase.extend({
  _getCompiledTemplate: function () {
    return template({
      title: this._getImageFileName(),
      desc: _t('editor.layers.image.title-label'),
      imgURL: this.model.get('image')
    });
  },

  _getImageFileName: function () {
    var imageURL = this.model.get('image');
    var fileNameWithParameters = _.last(imageURL.split('/'));
    var fileName = fileNameWithParameters.split('?')[0];
    return fileName;
  }
});
