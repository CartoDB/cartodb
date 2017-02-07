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
      title: this.model.get('label'),
      desc: _t('editor.layers.gmaps.title-label'),
      imgURL: this._getImageURL()
    });
  },

  _getImageURL: function () {
    var imageURL = [
      this._configModel.get('app_assets_base_url'),
      'unversioned/images/google-maps-basemap-icons',
      this.model.get('val') + '.jpg'
    ].join('/');
    return imageURL;
  }
});
