var _ = require('underscore');

module.exports = {
  type: 'georeference-city',
  label: _t('editor.layers.analysis-form.georeference-city'),
  fieldAttrs: {
    city_column: {
      showSearch: true
    },
    admin_region: {
      showSearch: true,
      allowFreeTextInput: true
    },
    country: {
      showSearch: true,
      allowFreeTextInput: true
    }
  },

  validatorFor: {
    city_column: ['required']
  },

  parametersDataFields: 'city_column,admin_region,country',

  parse: function (nodeAttrs) {
    var opts = {
      city_column: nodeAttrs.city_column,
      admin_region: nodeAttrs.admin_region || nodeAttrs.admin_region_column,
      country: nodeAttrs.country || nodeAttrs.country_column
    };

    return _.extend({
      type: 'georeference-city'
    }, opts);
  },

  formatAttrs: function (formAttrs, columnOptions) {
    _.each(['country', 'admin_region'], function (attr) {
      if (formAttrs[attr] && columnOptions.findColumn(formAttrs[attr], 'string')) {
        formAttrs[attr + '_column'] = formAttrs[attr];
        delete formAttrs[attr];
      } else {
        delete formAttrs[attr + '_column'];
      }
    }, this);

    return formAttrs;
  },

  getFieldAttrs: function (fieldName, value) {
    var attrs = this.fieldAttrs[fieldName];

    if (value && (fieldName === 'country' || fieldName === 'admin_region')) {
      attrs = _.extend(attrs, {
        customValue: {
          val: value,
          label: '"' + value + '"'
        }
      });
    }
    return attrs;
  }
};
