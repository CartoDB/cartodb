var _ = require('underscore');
var Backbone = require('backbone');
var camshaftReference = require('builder/data/camshaft-reference');

/**
 * Base model for all analysis form models.
 */
module.exports = Backbone.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.analyses) throw new Error('analyses is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.analysisSourceOptionsModel) throw new Error('analysisSourceOptionsModel is required');

    this._analyses = opts.analyses;
    this._configModel = opts.configModel;
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
    return {}; // override to return custom template data
  },

  _getSourceOption: function () {
    var sourceNodeDefModel = this._getSourceNodeDefModel();
    var layerName = sourceNodeDefModel.isSourceType()
      ? this._layerDefinitionModel.getTableName()
      : this._layerDefinitionModel.getName();

    return sourceNodeDefModel && [{
      val: sourceNodeDefModel.id,
      type: 'node',
      nodeTitle: this._analyses.short_title(sourceNodeDefModel),
      layerName: layerName,
      color: sourceNodeDefModel.getColor(),
      isSourceType: sourceNodeDefModel.isSourceType()
    }];
  },

  _getSourceNodeDefModel: function () {
    var sourceNames = ['source', 'primary_source'];
    var sourceNodeDefModel = _.reduce(sourceNames, function (memo, sourceName) {
      if (!memo) {
        memo = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get(sourceName));
      }
      return memo;
    }, null, this);

    return sourceNodeDefModel;
  },

  _primarySourceSchemaItem: function (customLabel) {
    return {
      type: 'NodeDataset',
      title: customLabel || _t('editor.layers.analysis-form.base-layer'),
      dialogMode: 'float',
      options: this._getSourceOption(),
      editorAttrs: {disabled: true}
    };
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

  /**
   * @deprecated use updateNodeDefinition instead
   */
  _updateNodeDefinition: function () {
    this.updateNodeDefinition.apply(this, arguments);
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
  },

  _isPrimarySource: function (sourceAttrName) {
    return sourceAttrName === this.get('primary_source_name');
  },

  _isFetchingOptions: function () {
    return this._analysisSourceOptionsModel.get('fetching');
  },

  _getSourceOptionsForSource: function (options) {
    options = options || {};
    var sourceAttrName = null;
    var requiredSimpleGeometryType = '*';
    var ignorePrimarySource = false;
    var includeSourceNode = options.includeSourceNode || false;

    // options validation and defaults
    if (options.sourceAttrName === void 0) {
      throw new Error('sourceAttrName is required.');
    } else {
      sourceAttrName = options.sourceAttrName;
    }

    if (options.requiredSimpleGeometryType !== void 0) {
      requiredSimpleGeometryType = options.requiredSimpleGeometryType;
    }

    if (options.ignorePrimarySource) {
      ignorePrimarySource = true;
    }

    var currentSource = this.get(sourceAttrName);

    if (!ignorePrimarySource && this._isPrimarySource(sourceAttrName)) {
      return [currentSource];
    }
    if (this._isFetchingOptions()) {
      return [{
        val: currentSource,
        label: _t('editor.layers.analysis-form.loading'),
        isLoading: true
      }];
    } else {
      // fetched
      var sourceId = this._layerDefinitionModel.get('source');
      return this._analysisSourceOptionsModel
        .getSelectOptions(requiredSimpleGeometryType)
        .filter(function (d) {
          return (
            (includeSourceNode ? true : d.val !== sourceId) &&
            (options.onlyNodes ? d.type === 'node' : true)
          );
        });
    }
  }
});
