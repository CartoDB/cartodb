var BaseLayerViewBase = require('./base-layer-view-base');
var template = require('./image-thumbnail-layer.tpl');

var DEFAULT_SUBDOMAIN = 'a';
var DEFAULT_X_POSITION = 30;
var DEFAULT_Y_POSISTION = 24;
var DEFAULT_ZOOM = 6;
var DEFAULT_NAME = 'Custom basemap';

module.exports = BaseLayerViewBase.extend({

  _getCompiledTemplate: function () {
    var title = this.model.getName() || DEFAULT_NAME;
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
      .replace('{s}', this._getSubdomain())
      .replace('{z}', DEFAULT_ZOOM)
      .replace('{x}', DEFAULT_X_POSITION)
      .replace('{y}', DEFAULT_Y_POSISTION);
  },

  _getSubdomain: function () {
    var subdomains = this.model.get('subdomains'); // eg: 'abcd' or '1234'
    if (subdomains) {
      return subdomains[0];
    }

    return DEFAULT_SUBDOMAIN;
  }
});
