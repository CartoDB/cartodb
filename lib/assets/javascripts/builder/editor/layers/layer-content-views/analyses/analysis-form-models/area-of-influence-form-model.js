var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./area-of-influence-form.tpl');
var DistanceConverter = require('builder/value-objects/distance-converter');

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
    this.on('change:distance', this._onDistanceChanged, this);
    this.on('change:kind', this._onKindChanged, this);
  },

  getTemplate: function () {
    return template;
  },

  getTemplateData: function () {
    return {parametersDataFields: this._typeDef().parametersDataFields};
  },

  /**
   * @override {BaseAnalysisFormModel.updateNodeDefinition}
   */
  updateNodeDefinition: function (nodeDefModel) {
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
        source: this._primarySourceSchemaItem(),
        type: {
          type: 'Radio',
          text: _t('editor.layers.analysis-form.type'),
          options: AREA_OF_INFLUENCE_TYPES.map(function (d) {
            var isAnalysisTypeEnabled = this._analyses.isAnalysisValidByType(d.type, { configModel: this._configModel });
            var canChangeToType = this._canChangeToType(d.type);
            var isDisabled = !isAnalysisTypeEnabled || !canChangeToType;
            var helpMessage = !isAnalysisTypeEnabled ? _t('editor.layers.analysis-form.disabled-by-config') : _t('editor.layers.analysis-form.valid-type');

            return {
              val: d.type,
              label: d.label,
              disabled: isDisabled,
              help: isDisabled ? helpMessage : ''
            };
          }, this)
        },
        distance: {
          type: 'Radio',
          title: _t('editor.layers.analysis-form.units'),
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
          validators: ['required', this._radiusInterval()]
        },
        kind: {
          type: 'Select',
          title: _t('editor.layers.analysis-form.by'),
          dialogMode: 'float',
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
          help: _t('editor.layers.analysis-form.tracts-help'),
          validators: ['required', {
            type: 'interval',
            min: 1,
            max: 4
          }]
        },
        time: {
          type: 'Number',
          title: _t('editor.layers.analysis-form.time-seconds'),
          validators: ['required', this._timeInterval()]
        },
        dissolved: {
          type: 'Radio',
          title: _t('editor.layers.analysis-form.boundaries'),
          options: [
            {
              val: 'false',
              label: _t('editor.layers.analysis-form.intact'),
              help: _t('editor.layers.analysis-form.intact-help')
            }, {
              val: 'true',
              label: _t('editor.layers.analysis-form.dissolved'),
              help: _t('editor.layers.analysis-form.dissolved-help')
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

  _onDistanceChanged: function () {
    this._fitParamToRange('radius', this._radiusInterval());
    this._setSchema();
  },

  _onKindChanged: function () {
    this._fitParamToRange('time', this._timeInterval());
    this._setSchema();
  },

  _fitParamToRange: function (paramName, range) {
    var val = this.get(paramName);
    if (val < range.min) {
      val = range.min;
    } else if (val > range.max) {
      val = range.max;
    }
    this.set(paramName, val, {silent: true});
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

  _radiusInterval: function () {
    switch (this.get('distance')) {
      case 'meters':
        return {
          type: 'interval',
          min: 10,
          max: 10000
        };
      case 'kilometers':
      case 'miles':
        return {
          type: 'interval',
          min: 0.5,
          max: 100,
          step: 0.5
        };
      default:
        return {
          type: 'interval',
          min: 1,
          max: 100
        };
    }
  },

  _timeInterval: function () {
    switch (this.get('kind')) {
      case 'car':
        return {
          type: 'interval',
          min: 60,
          max: 14400,
          step: 10
        };
      case 'walk':
      default:
        return {
          type: 'interval',
          min: 60,
          max: 3600
        };
    }
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
