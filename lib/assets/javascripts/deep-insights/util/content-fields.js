var _ = require('underscore');

var ContentFieldsUtil = {
  getContentForFields: function (attributes, options) {
    options = options || {};
    var renderFields = this._setRenderFields(attributes, options);

    return {
      fields: renderFields,
      data: attributes
    };
  },

  _setRenderFields: function (attributes, options) {
    var renderFields = _.map(attributes.fields, function (field, index) {
      var value = attributes.content[field.name];
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
  },

  _setLoading: function () {
    return {
      content: {
        fields: [{
          type: 'loading',
          title: _t('infowindows.loading'),
          value: '…'
        }]
      }
    };
  },

  _setError: function () {
    return {
      content: {
        fields: [{
          title: null,
          alternative_name: null,
          value: _t('infowindows.error'),
          index: null,
          type: 'error'
        }],
        data: {}
      }
    };
  }
};

module.exports = ContentFieldsUtil;
