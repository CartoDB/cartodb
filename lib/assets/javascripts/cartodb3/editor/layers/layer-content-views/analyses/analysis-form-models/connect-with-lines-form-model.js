var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./connect-with-lines.tpl');
var ColumnOptions = require('../column-options');

var ROUTING_TYPES = require('./connect-with-lines-types');

var TYPE_TO_META_MAP = {};
ROUTING_TYPES.map(function (d) {
  TYPE_TO_META_MAP[d.type] = d;
});

/**
 * Form model for a convex hull analysis
 */
module.exports = BaseAnalysisFormModel.extend({
  defaults: {
    mode: 'car',
    units: 'kilometers',
    order_type: 'asc'
  },

  parse: function (attrs) {
    return _.defaults(
      _.pick(attrs, 'id', 'source'), // maintain default attrs
      this._typeDef(attrs.type).parse(attrs)
    );
  },
  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this._columnOptions = new ColumnOptions({}, {
      configModel: this._configModel,
      nodeDefModel: this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'))
    });

    this.listenTo(this._columnOptions, 'columnsFetched', this._setSchema);
    this.on('change:type', this._onTypeChanged, this);

    this._setSchema();
  },

  _onTypeChanged: function () {
    this._replaceAttrs();
    this._setSchema();
  },

  _replaceAttrs: function () {
    var attrs = this.parse(this.attributes);
    this.clear({ silent: true });
    this.set('type', attrs.type, { silent: true }); // re-set type to avoid change:type event to trigger again
    this.set(_.extend(attrs, this.defaults));
  },

  updateNodeDefinition: function (nodeDefModel) {
    var attrs = this._formatAttrs(this.attributes);
    nodeDefModel.clear({ silent: true });
    nodeDefModel.set(attrs);
  },

  _formatAttrs: function (formAttrs) {
    var customFormattedFormAttrs = this._typeDef().formatAttrs(formAttrs, this._columnOptions);
    return BaseAnalysisFormModel.prototype._formatAttrs.call(this, customFormattedFormAttrs);
  },

  getTemplate: function () {
    return template;
  },

  getTemplateData: function () {
    return { parametersDataFields: this._typeDef().parametersDataFields };
  },

  _filterSchemaFieldsByType: function (schema) {
    // Always include the source field in addition to the type-specific fields
    var fields = ['source', 'type'].concat(this._typeDef().parametersDataFields.split(','));
    return _.pick(schema, fields);
  },

  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    BaseAnalysisFormModel.prototype._setSchema.call(this, this._filterSchemaFieldsByType({
      source: this._primarySourceSchemaItem(),
      type: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.type'),
        options: ROUTING_TYPES.map(function (d) {
          return {
            val: d.type,
            label: d.label
          };
        }, this)
      },
      source_column: {
        type: 'Select',
        title: 'source',
        options: this._getColumnOptions('source_column', 'string'),
        validators: ['required']
      },
      column_target: {
        type: 'Select',
        title: 'column target',
        options: this._getColumnOptions('source_column', 'string'),
        validators: ['required']
      },
      destination_longitude: {
        type: 'Text',
        title: _t('editor.layers.analysis-form.longitude'),
        validators: ['required']
      },
      destination_latitude: {
        type: 'Text',
        title: _t('editor.layers.analysis-form.latitude'),
        validators: ['required']
      },
      closest: {
        type: 'Radio',
        title: 'closest',
        options: [
          { label: _t('editor.layers.analysis-form.to-closest'), val: 'true' },
          { label: _t('editor.layers.analysis-form.all-to-all'), val: 'false' }
        ]
      },
      /*
      units: {
        type: 'Cascade',
        title: '',
        label: _t('editor.layers.analysis-form.weighted-by'),
        help: _t('editor.layers.analysis-form.weighted-by-help'),
        validators: ['required'],
        editors: [
          ['destination_latitude', {
            type: 'Text',
            title: _t('editor.layers.analysis-form.latitude'),
            validators: ['required']
          }
          ], [
            'destination_longitude', {
              type: 'Text',
              title: _t('editor.layers.analysis-form.longitude'),
              validators: ['required']
            }
          ]
        ]
      },
      */
      order_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.order-by'),
        options: this._columnOptions.filterByType('number')
      },
      order_type: {
        type: 'Radio',
        title: _t('editor.layers.analysis-form.order'),
        options: [
          { label: _t('editor.layers.analysis-form.asc'), val: 'asc' },
          { label: _t('editor.layers.analysis-form.desc'), val: 'desc' }
        ]
      },
      mode: {
        type: 'Select',
        title: 'mode',
        options: [
          { label: _t('editor.layers.analysis-form.car'), val: 'car' },
          { label: _t('editor.layers.analysis-form.walk'), val: 'walk' },
          { label: _t('editor.layers.analysis-form.bicycle'), val: 'bicycle' },
          { label: _t('editor.layers.analysis-form.public_transport'), val: 'public_transport' }
        ]
      }
    }));
  },

  _getColumnOptions: function (attr, attrType) {
    var opts = this._columnOptions.filterByType(attrType);

    if (this._columnOptions.get('columnsFetched') && this.get(attr)) {
      var attrExists = false;
      var value = this.get(attr);

      var customValue = {
        val: value,
        label: '"' + value + '"'
      };

      if (opts && opts.length) {
        attrExists = _.find(opts, function (attr) {
          return attr.val === customValue.val;
        });
      }

      if (!attrExists) {
        opts.push(customValue);
        opts = _.sortBy(opts, function (d) {
          return d.val;
        });
      }
    }
    return opts;
  },

  _typeDef: function (type) {
    type = type || this.get('type');
    return TYPE_TO_META_MAP[type];
  }
});
