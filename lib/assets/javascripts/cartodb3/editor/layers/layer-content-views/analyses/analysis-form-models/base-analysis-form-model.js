var _ = require('underscore');
var cdb = require('cartodb.js');
var camshaftReference = require('../../../../../data/camshaft-reference');

/**
 * Base model for all analysis form models.
 */
module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.analysisSourceOptionsModel) throw new Error('analysisSourceOptionsModel is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._analysisSourceOptionsModel = opts.analysisSourceOptionsModel;
  },

  isNew: function () {
    return true; // so one can call .destroy() on it to clean up bindings etc. and have it removed from its collection
  },

  getTemplate: function () {
    return undefined; // override to return custom template
  },

  getTemplateData: function () {
    return undefined; // override to return custom template data
  },

  validate: function () {
    var type = this.get('type');
    var sourceNames = camshaftReference.getSourceNamesForAnalysisType(type);
    var paramNames = camshaftReference.getParamNamesForAnalysisType(type);

    var errors = _.reduce(paramNames, function (memo, name) {
      var val = this.attributes[name];

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
  },

  save: function (analysisDefinitionNodesCollection) {
    if (this.has('id')) {
      var nodeDefModel = analysisDefinitionNodesCollection.get(this.id);
      if (nodeDefModel) {
        this._updateNodeDefinition(nodeDefModel);
      }
    } else {
      this._createNodeDefinition();
    }
  },

  /**
   * @protected
   */
  _updateNodeDefinition: function (nodeDefModel) {
    nodeDefModel.set(this.attributes);
  },

  /**
   * @protected
   */
  _createNodeDefinition: function () {
    this._layerDefinitionModel.createNewAnalysisNode(this.attributes);
  },

  /**
   * @protected
   */
  _setSchema: function (schema) {
    this.schema = schema;
    this.trigger('changeSchema', this);
  }

});
