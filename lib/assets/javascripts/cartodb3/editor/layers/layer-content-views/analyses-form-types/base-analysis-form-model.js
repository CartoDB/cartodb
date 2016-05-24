var _ = require('underscore');
var cdb = require('cartodb.js');
var camshaftReference = require('../../../../data/camshaft-reference');

/**
 * Base model for all analysis models
 */
module.exports = cdb.core.Model.extend({

  /**
   * @protected
   */
  setSchema: function (schema) {
    this.schema = schema;
    this.trigger('changeSchema', this);
  },

  validate: function (attrs) {
    if (!this.schema) throw new Error('setSchema should have been called before any validation is done');

    var type = this.get('type');
    var sourceNames = camshaftReference.getSourceNamesForAnalysisType(type);
    var paramNames = camshaftReference.getParamNamesForAnalysisType(type);

    var errors = _.reduce(paramNames, function (memo, name) {
      if (!this.schema[name]) return memo; // skip params that are not included in the form

      var val = attrs[name];

      if (_.contains(sourceNames, name) && val === 'source-placeholder') {
        memo[name] = _t('data.analysis-definition-node-model.validation.invalid-source');
      } else if (val === undefined) {
        memo[name] = _t('data.analysis-definition-node-model.validation.required');
      }

      return memo;
    }, {}, this);

    if (!_.isEmpty(errors)) {
      return errors;
    }
  }

});
