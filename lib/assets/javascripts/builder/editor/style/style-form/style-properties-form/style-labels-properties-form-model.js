var _ = require('underscore');
var StyleFormDefaultModel = require('builder/editor/style/style-form/style-form-default-model');

var FILL_PROPERTIES = [
  { source: 'size', value: 'fillSize' },
  { source: 'color', value: 'fillColor' }
];

var HALO_PROPERTIES = [
  { source: 'size', value: 'haloSize' },
  { source: 'color', value: 'haloColor' }
];

module.exports = StyleFormDefaultModel.extend({

  _FORM_NAME: 'labels',

  parse: function (response) {
    return {
      enabled: response.enabled,
      attribute: response.attribute,
      font: response.font,
      fillSize: response.fill.size,
      fillColor: response.fill.color,
      haloSize: response.halo.size,
      haloColor: response.halo.color,
      offset: response.offset,
      overlap: response.overlap,
      placement: response.placement
    };
  },

  _onChange: function () {
    var attrs = _.clone(this.attributes);

    if (attrs.enabled && !attrs.attribute) {
      return false;
    }

    this._updatePartialProperties(attrs);

    this._styleModel.set('labels', attrs);
  },

  _updatePartialProperties: function (attrs) {
    this._setProperties(FILL_PROPERTIES, 'fill', attrs);
    this._setProperties(HALO_PROPERTIES, 'halo', attrs);

    return attrs;
  },

  _setProperties: function (properties, propertyName, attrs) {
    attrs[propertyName] = _.extend(this._styleModel.get('labels')[propertyName]);

    properties.forEach(function (property) {
      if (attrs[property.value]) {
        attrs[propertyName][property.source] = attrs[property.value];
      }
    });
  }
});
