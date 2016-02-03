var _ = require('underscore');
var WidgetTypes = ['histogram', 'category', 'formula', 'time-series'];
var FormSchemaModel = require('./widget-form-schema-model');

module.exports = {

  createWidgetFormModel: function (attrs) {
    this.attrs = this._flattenAttributes(attrs);
    var WidgetFormSchemaModel = this._createFormSchemaModel[attrs.type].call(this);
    return new WidgetFormSchemaModel(this.attrs);
  },

  _flattenAttributes: function (attrs) {
    return _.extend(_.omit(attrs, 'options'), attrs.options);
  },

  _generateFormSchemaModel: function (attrs) {
    return FormSchemaModel.extend({ schema: attrs });
  },

  _attrsForSchemaModel: function (customAttrs) {
    return _.extend({
      type: {
        type: 'Select',
        options: WidgetTypes
      },
      title: {
        type: 'Text',
        validators: ['required']
      },
      layer_id: {
        type: 'Select',
        label: 'Source layer',
        options: [].concat(this.attrs.layer_id)
      },
      sync: {
        type: 'Radio',
        label: 'Dynamic',
        options: [
          {
            val: true,
            label: 'yes'
          }, {
            val: false,
            label: 'no'
          }
        ]
      },
      column: {
        type: 'Select',
        options: [].concat(this.attrs.column)
      }
    }, customAttrs);
  },

  _createFormSchemaModel: {
    formula: function () {
      return this._generateFormSchemaModel(this._attrsForSchemaModel({
        operation: {
          type: 'Select',
          options: ['min', 'max', 'count', 'avg']
        },
        suffix: {
          type: 'Text'
        },
        prefix: {
          type: 'Text'
        }
      }));
    },

    category: function () {
      return this._generateFormSchemaModel(this._attrsForSchemaModel({
        aggregationColumn: {
          type: 'Select',
          options: []
        },
        suffix: {
          type: 'Text'
        },
        prefix: {
          type: 'Text'
        }
      }));
    },

    histogram: function () {
      return this._generateFormSchemaModel(this._attrsForSchemaModel({
        bins: {
          label: 'Buckets',
          type: 'Number'
        }
      }));
    },

    'time-series': function () {
      return this._generateFormSchemaModel(this._attrsForSchemaModel({
        bins: {
          label: 'Buckets',
          type: 'Number'
        },
        start: {
          type: 'Date'
        },
        end: {
          type: 'Date'
        }
      }));
    }
  }
};
