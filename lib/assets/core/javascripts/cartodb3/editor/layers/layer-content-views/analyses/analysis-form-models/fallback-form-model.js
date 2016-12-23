var _ = require('underscore');
var camshaftReference = require('../../../../../data/camshaft-reference');
var BaseAnalysisFormModel = require('./base-analysis-form-model');

var ARRAY_SPLIT_COMBO = ',';

/**
 * A fallback form model in case the type is not supported (yet).
 */
module.exports = BaseAnalysisFormModel.extend({

  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this.listenTo(this._analysisSourceOptionsModel, 'change:fetching', this._updateSchema);

    this._updateSchema();
  },

  getTemplate: function () {
    return undefined;
  },

  getTemplateData: function () {
    return {};
  },

  /**
   * @override {BaseAnalysisFormModel._formatAttrs}
   */
  _formatAttrs: function () {
    var attrs = BaseAnalysisFormModel.prototype._formatAttrs.apply(this, arguments);

    var params = camshaftReference.paramsForType(this.get('type'));
    for (var name in params) {
      var param = params[name];
      if (param.type === 'array') {
        if (!_.isString(attrs[name]) || attrs[name].trim() === '') {
          attrs[name] = null;
        } else {
          attrs[name] = attrs[name]
            .split(ARRAY_SPLIT_COMBO)
            .map(function (val) {
              return val.trim();
            });
        }
      }
    }

    return attrs;
  },

  _updateSchema: function () {
    var schema = {
      type: {
        type: 'Text',
        title: 'Type',
        editorAttrs: {disabled: true}
      }
    };
    var params = camshaftReference.paramsForType(this.get('type'));

    var sourceCount = _.reduce(Object.keys(params), function (memo, name) {
      if (params[name].type === 'node') {
        memo++;
      }
      return memo;
    }, 0);

    Object.keys(params)
      .forEach(function (name) {
        var param = params[name];
        var label = name + ' (' + param.type + ')';
        var validators = [];
        var isRequired = !param.optional;

        if (isRequired) {
          label += '*';
          validators.push('required');
        }

        switch (param.type) {
          case 'node':
            schema[name] = sourceCount === 1
              ? {
                type: 'Select',
                text: label,
                options: [ this.get('source') ],
                editorAttrs: { disabled: true }
              }
              : {
                type: 'Select',
                title: label,
                options: this._getSourceOptionsForSource(name, param.geometry)
              };
            break;
          case 'string':
            var fieldDef;

            // If is meant to represent a column try to get columns if possible
            if (/column/.test(name) && sourceCount === 1) {
              var nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'));
              if (nodeDefModel && nodeDefModel.querySchemaModel.columnsCollection.length > 0) {
                fieldDef = {
                  type: 'Text',
                  title: label,
                  validators: validators
                };
              }
            }

            if (!fieldDef) {
              fieldDef = {
                type: 'Text',
                title: label,
                validators: validators
              };
            }

            schema[name] = fieldDef;
            break;
          case 'enum':
            schema[name] = {
              type: 'Select',
              title: label,
              options: param.values.map(function (val) {
                return {
                  val: val,
                  label: val
                };
              }),
              validators: validators
            };
            break;
          case 'number':
            schema[name] = {
              type: 'Text',
              label: label,
              validators: validators
            };
            break;
          case 'boolean':
            schema[name] = {
              type: 'Radio',
              text: label,
              options: [
                {val: 'true', label: 'true'},
                {val: 'false', label: 'false'}
              ],
              validators: validators
            };
            break;
          case 'array':
            schema[name] = {
              type: 'Text',
              title: label,
              validators: validators,
              help: 'Separate values by "' + ARRAY_SPLIT_COMBO + '"'
            };
            break;
          default:
            return null;
        }
      }, this);

    this._setSchema(schema);
  },

  /**
   * @param {String} sourceAttrName
   * @param {Array<String>} requiredSimpleGeometryTypes
   */
  _getSourceOptionsForSource: function (sourceAttrName, requiredSimpleGeometryTypes) {
    var currentSource = this.get(sourceAttrName);

    if (this._isFetchingOptions()) {
      return [{
        val: currentSource,
        label: _t('components.backbone-forms.select.loading'),
        isLoading: true
      }];
    } else {
      // fetched
      var sourceId = this._layerDefinitionModel.get('source');
      return this._analysisSourceOptionsModel
        .getSelectOptions(requiredSimpleGeometryTypes)
        .filter(function (d) {
          // Can't select own layer as source, so exclude it
          return d.val !== sourceId;
        });
    }
  },

  _isFetchingOptions: function () {
    return this._analysisSourceOptionsModel.get('fetching');
  }

});
