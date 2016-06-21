var _ = require('underscore');
var Backbone = require('backbone');
var camshaftReference = require('../../../../../data/camshaft-reference');

/**
 * Base model for all analysis form models.
 */
module.exports = Backbone.Model.extend({

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

  /**
   * @override {Backbone.Model.prototype.set} Maintain persisted attr if model is clear'ed
   */
  set: function (key, val, options) {
    if (key == null) return this;

    var attrs;
    if (typeof key === 'object') {
      attrs = key;
      options = val;
    } else {
      (attrs = {})[key] = val;
    }

    options || (options = {});

    var persisted = attrs.persisted || this.get('persisted');

    Backbone.Model.prototype.set.call(this, attrs, options);

    if (persisted !== undefined) {
      Backbone.Model.prototype.set.call(this, 'persisted', persisted, {silent: true});
    }

    return this;
  },

  updateNodeDefinition: function (nodeDefModel) {
    var nodeAttrs = this._formatAttrs(this.attributes);
    nodeDefModel.set(nodeAttrs);
  },

  createNodeDefinition: function (userActions) {
    var nodeAttrs = this._formatAttrs(this.attributes);
    this.set('persisted', true);
    return userActions.createAnalysisNode(nodeAttrs, this._layerDefinitionModel);
  },

  _formatAttrs: function (formAttrs) {
    return _.omit(camshaftReference.parse(formAttrs), 'persisted');
  },

  _setSchema: function (schema) {
    this.schema = schema;
    this.trigger('changeSchema', this);
  }
});
