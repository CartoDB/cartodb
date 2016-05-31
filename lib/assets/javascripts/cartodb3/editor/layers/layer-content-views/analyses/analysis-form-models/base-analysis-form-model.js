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

    this.schema = {};
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

  setFormValidationErrors: function (errors) {
    this._formValidationErrors = errors;
    this.trigger('change', this);
  },

  validate: function () {
    var errors = _.extend(
      {},
      camshaftReference.validate(this.attributes),
      this._formValidationErrors
    );

    if (!_.isEmpty(errors)) {
      return errors;
    }
  },

  save: function () {
    if (!this.isValid()) return;

    var nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.id);
    if (nodeDefModel) {
      this._updateNodeDefinition(nodeDefModel);
    } else {
      this._createNodeDefinition();
    }
  },

  /**
   * @protected
   */
  _updateNodeDefinition: function (nodeDefModel) {
    nodeDefModel.set(this._formatAttrs(this.attributes));
  },

  /**
   * @protected
   */
  _createNodeDefinition: function () {
    this._layerDefinitionModel.createNewAnalysisNode(this._formatAttrs(this.attributes));
    this.set('persisted', true);
  },

  /**
   * @protected
   */
  _formatAttrs: function (formAttrs) {
    return _.omit(camshaftReference.parse(formAttrs), 'persisted');
  },

  /**
   * @protected
   */
  _setSchema: function (schema) {
    this.schema = schema;
    this.trigger('changeSchema', this);
  }

});
