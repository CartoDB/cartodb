var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./filter-intersection-form.tpl');
var ColumnOptions = require('../column-options');

/**
 *  Filter points in polygon model
 */
module.exports = BaseAnalysisFormModel.extend({

  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this._columnOptions = new ColumnOptions({}, {
      configModel: this._configModel
    });

    this.listenTo(this._analysisSourceOptionsModel, 'change:fetching', this._setSchema);
    this.listenTo(this._columnOptions, 'columnsFetched', this._setSchema);

    this.on('change:target', this._onChangeTarget, this);

    this._setSchema();
    this._fetchColumns();
  },

  _formatAttrs: function (formAttrs) {
    var customFormattedFormAttrs = _.pick(formAttrs, ['id', 'source', 'target', 'type']);
    return BaseAnalysisFormModel.prototype._formatAttrs.call(this, customFormattedFormAttrs);
  },

  getTemplate: function () {
    return template;
  },

  getTemplateData: function () {
    return {};
  },

  _filterSchemaFieldsByType: function (schema) {
    // Always include the source and target fields in addition to the type-specific fields
    return _.pick(schema, ['source', 'target', 'type']);
  },

  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    BaseAnalysisFormModel.prototype._setSchema.call(this, this._filterSchemaFieldsByType({
      source: this._primarySourceSchemaItem(),
      target: {
        type: 'NodeDataset',
        title: _t('editor.layers.analysis-form.target-layer'),
        options: this._getSourceOptionsForSource('target', 'point'),
        validators: ['required'],
        editorAttrs: {
          disabled: this._isSourceDisabled('target')
        }
      }
    }));
  },

  _onChangeTarget: function () {
    this._analysisSourceOptionsModel.createSourceNodeUnlessExisting(this.get('target'));
    this._fetchColumns();
  },

  _fetchColumns: function () {
    var target = this.get('target');

    var nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(target);

    if (nodeDefModel) {
      this._columnOptions.setNode(nodeDefModel);
    } else if (target) {
      this._columnOptions.setDataset(target);
    }
  },

  _isSourceDisabled: function (sourceAttrName) {
    return this._isPrimarySource(sourceAttrName) || this._isFetchingOptions();
  },

  _isPrimarySource: function (sourceAttrName) {
    return sourceAttrName === this.get('primary_source_name');
  },

  _isFetchingOptions: function () {
    return this._analysisSourceOptionsModel.get('fetching');
  },

  _getSourceOptionsForSource: function (sourceAttrName, requiredSimpleGeometryType) {
    var currentSource = this.get(sourceAttrName);

    if (this._isPrimarySource(sourceAttrName)) {
      return [currentSource];
    } else if (this._isFetchingOptions()) {
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
          // Can't select own layer as source, so exclude it
          return d.val !== sourceId;
        });
    }
  }
});
