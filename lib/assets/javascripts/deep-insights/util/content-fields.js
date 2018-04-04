var _ = require('underscore');

var ContentFieldsUtil = {
  getContentForFields: function (attributes, fields, options) {
    options = options || {};
    var renderFields = this._setRenderFields(fields, options, attributes);

    return {
      fields: renderFields,
      data: attributes
    };
  },

  _setRenderFields: function (fields, options, attributes) {
    var renderFields = _.map(fields, function (field, index) {
      var value = attributes[field.name];
      if (options.showEmptyFields || !_.isUndefined(value)) {
        return this._buildRenderField(field, value, index);
      }
    }.bind(this));

    return this._getFields(renderFields);
  },

  _buildRenderField: function (field, value, index) {
    return {
      name: field.name,
      title: field.title ? field.name : null,
      value: !_.isUndefined(value) ? value : null,
      index: index
    };
  },

  _getFields: function (fields) {
    var EMPTY_FIELD = {
      title: null,
      value: _t('infowindows.content-fields.empty.no-data'),
      index: 0,
      type: 'empty'
    };

    return fields.length !== 0 ? fields : EMPTY_FIELD;
  }
};

module.exports = ContentFieldsUtil;
