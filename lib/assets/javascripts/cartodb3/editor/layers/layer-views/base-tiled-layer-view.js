/* global Image */

var BaseLayerViewBase = require('./base-layer-view-base');
var template = require('./image-thumbnail-layer.tpl');

var DEFAULT_SUBDOMAIN = 'a';
var DEFAULT_X_POSITION = 30;
var DEFAULT_Y_POSISTION = 24;
var DEFAULT_ZOOM = 6;
var DEFAULT_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoAQAAAACkhYXAAAAAAnRSTlMAAHaTzTgAAAALSURBVHgBYxhhAAAA8AAB4rh1IgAAAABJRU5ErkJggg==';
var DEFAULT_NAME = _t('editor.layers.basemap.custom-basemap');

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
    var self = this;
    var url = this._lowerXYZ();

    var image = new Image();
    image.onerror = function () {
      self.$('.js-thumbnailImg').attr('src', DEFAULT_IMG);
    };
    image.src = url;

    return url;
  },

  _getSubdomain: function () {
    var subdomains = this.model.get('subdomains'); // eg: 'abcd' or '1234'

    return (subdomains && subdomains.length) ? subdomains[0] : DEFAULT_SUBDOMAIN;
  },

  _lowerXYZ: function () {
    return this.model.get('urlTemplate')
      .replace('{s}', this._getSubdomain())
      .replace('{z}', DEFAULT_ZOOM)
      .replace('{x}', DEFAULT_X_POSITION)
      .replace('{y}', DEFAULT_Y_POSISTION);
  }
});
