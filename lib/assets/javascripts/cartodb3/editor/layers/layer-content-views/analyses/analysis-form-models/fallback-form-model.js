var _ = require('underscore');
var camshaftReference = require('../../../../../data/camshaft-reference');
var BaseAnalysisFormModel = require('./base-analysis-form-model');

/**
 * A fallback form model in case the type is not supported (yet).
 */
module.exports = BaseAnalysisFormModel.extend({

  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this._setSchema();
  },

  getTemplate: function () {
    return undefined;
  },

  getTemplateData: function () {
    return {};
  },

  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    var params = camshaftReference.paramsForType(this.get('type'));
    var schema = Object.keys(params)
      .map(function (name) {
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
            return {
              type: 'Text',
              title: label,
              validators: validators
            };
          case 'string':
            return {
              type: 'Text',
              title: label,
              validators: validators
            };
          case 'enum':
            return {
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
          case 'number':
            return {
              type: 'Number',
              label: label,
              validators: validators
            };
          case 'boolean':
            return {
              type: 'Radio',
              text: label,
              options: [
                {val: 'true', label: 'true'},
                {val: 'false', label: 'false'}
              ],
              validators: validators
            };
          case 'array':
            return {
              type: 'Text',
              title: label,
              validators: validators,
              help: 'Separate values by "||"'
            };
          default:
            return null;
        }
      });

    BaseAnalysisFormModel.prototype._setSchema.call(this, _.uniq(schema));
  }

});
