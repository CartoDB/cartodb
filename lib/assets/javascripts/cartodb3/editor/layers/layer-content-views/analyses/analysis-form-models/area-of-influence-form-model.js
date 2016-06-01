var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./area-of-influence-form.tpl');
var DistanceConverter = require('../../../../../value-objects/distance-converter');

var AREA_OF_INFLUENCE_TYPES = require('./area-of-influence-types');
var TYPE_TO_META_MAP = {};
AREA_OF_INFLUENCE_TYPES.map(function (d) {
  TYPE_TO_META_MAP[d.type] = d;
});

module.exports = BaseAnalysisFormModel.extend({

  parse: function (attrs) {
    return _.defaults(
      _.pick(attrs, 'id', 'source'), // maintain default attrs
      this._typeDef(attrs.type).parse(attrs)
    );
  },

  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this._setSchema();

    this.on('change:type', this._onTypeChanged, this);
  },

  getTemplate: function () {
    return template;
  },

  getTemplateData: function () {
    return {parametersDataFields: this._typeDef().parametersDataFields};
  },

  /**
   * @override {BaseAnalysisFormModel._updateNodeDefinition}
   */
  _updateNodeDefinition: function (nodeDefModel) {
    var attrs = this._formatAttrs(this.attributes);
    nodeDefModel.clear({silent: true});
    nodeDefModel.set(attrs);
  },

  _formatAttrs: function (formAttrs) {
    var customFormattedFormAttrs = this._typeDef().formatAttrs(formAttrs);
    return BaseAnalysisFormModel.prototype._formatAttrs.call(this, customFormattedFormAttrs);
  },

  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    BaseAnalysisFormModel.prototype._setSchema.call(this,
      this._filterSchemaFieldsByType({
        source: {
          type: 'Select',
          text: _t('editor.layers.analysis-form.source'),
          options: [ this.get('source') ],
          editorAttrs: { disabled: true }
        },
        type: {
          type: 'Radio',
          text: _t('editor.layers.analysis-form.type'),
          options: AREA_OF_INFLUENCE_TYPES.map(function (d) {
            return {
              val: d.type,
              label: d.label,
              disabled: !this._canChangeToType(d.type)
            };
          }, this)
        },
        distance: {
          type: 'Radio',
          text: _t('editor.layers.analysis-form.distance'),
          options: _.map(DistanceConverter.OPTIONS, function (d) {
            return {
              val: d.distance,
              label: this._distanceLabel(d.distance)
            };
          }, this)
        },
        radius: {
          type: 'Number',
          label: _t('editor.layers.analysis-form.radius'),
          validators: ['required', {
            type: 'interval',
            min: 1,
            max: 100
          }]
        },
        kind: {
          type: 'Select',
          title: _t('editor.layers.analysis-form.by'),
          options: [
            {
              val: 'walk',
              label: _t('editor.layers.analysis-form.by-walk')
            }, {
              val: 'car',
              label: _t('editor.layers.analysis-form.by-car')
            }
          ]
        },
        isolines: {
          type: 'Number',
          title: _t('editor.layers.analysis-form.tracts'),
          validators: ['required', {
            type: 'interval',
            min: 1,
            max: 6
          }]
        },
        time: {
          type: 'Number',
          title: _t('editor.layers.analysis-form.time'),
          validators: ['required', {
            type: 'interval',
            min: 1,
            max: 3600
          }]
        },
        dissolved: {
          type: 'Radio',
          title: _t('editor.layers.analysis-form.boundaries'),
          options: [
            {
              val: 'false',
              label: _t('editor.layers.analysis-form.intact')
            }, {
              val: 'true',
              label: _t('editor.layers.analysis-form.dissolved')
            }
          ]
        }
      })
    );
  },

  _canChangeToType: function (type) {
    if (type === this.get('type')) return true;

    var source = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'));
    return source.isValidAsInputForType(type);
  },

  _filterSchemaFieldsByType: function (schema) {
    // Always include the source field in addition to the type-specific fields
    var fields = ['source'].concat(this._typeDef().parametersDataFields.split(','));
    return _.pick(schema, fields);
  },

  _onTypeChanged: function () {
    this._replaceAttrs();
    this._setSchema();
  },

  _replaceAttrs: function () {
    var attrs = this.parse(this.attributes);
    this.clear({silent: true});
    this.set('type', attrs.type, {silent: true}); // re-set type to avoid change:type event to trigger again
    this.set(attrs);
  },

  _typeDef: function (type) {
    type = type || this.get('type');
    return TYPE_TO_META_MAP[type];
  },

  _distanceLabel: function (distance) {
    switch (distance) {
      case 'meters':
        return _t('editor.layers.analysis-form.meters');
      case 'kilometers':
        return _t('editor.layers.analysis-form.kilometers');
      case 'miles':
        return _t('editor.layers.analysis-form.miles');
      default:
        return '';
    }
  }

});
