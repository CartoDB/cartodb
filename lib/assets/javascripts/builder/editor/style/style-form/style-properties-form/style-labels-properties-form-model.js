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

  _onChange: function () {
    var labelsAttributes = _.extend({}, this.attributes);

    if (labelsAttributes.enabled && !labelsAttributes.attribute) {
      return false;
    }

    this._cleanProperties(FILL_PROPERTIES, 'fill', labelsAttributes);
    this._cleanProperties(HALO_PROPERTIES, 'halo', labelsAttributes);

    this._styleModel.set('labels', labelsAttributes);
  },

  _cleanProperties: function (properties, propertyName, labelsAttributes) {
    properties.forEach(function (property) {
      if (labelsAttributes[property.value]) {
        labelsAttributes[propertyName][property.source] = labelsAttributes[property.value];
      }
    });
  }
});
