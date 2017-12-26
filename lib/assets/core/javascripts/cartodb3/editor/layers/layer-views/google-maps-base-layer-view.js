var BaseLayerViewBase = require('./base-layer-view-base');
var template = require('./image-thumbnail-layer.tpl');

module.exports = BaseLayerViewBase.extend({
  initialize: function (opts) {
    BaseLayerViewBase.prototype.initialize.apply(this, arguments);

    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;
  },

  _getCompiledTemplate: function () {
    return template({
      title: this._getTitle(),
      desc: _t('editor.layers.gmaps.title-label'),
      imgURL: this._getImageURL()
    });
  },

  _getImageURL: function () {
    var imageName = this.model.get('baseType');
    if (this.model.get('baseName')) {
      imageName = imageName + '_' + this.model.get('baseName');
    }
    var imageURL = [
      this._configModel.get('app_assets_base_url'),
      'unversioned/images/google-maps-basemap-icons',
      imageName + '.jpg'
    ].join('/');
    return imageURL;
  },

  _getTitle: function () {
    return this.model.get('name').replace('GMaps ', '');
  }
});
