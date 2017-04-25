var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./filter-by-node-column.tpl');
var ColumnOptions = require('../column-options');

/**
 * Form model for a centroid and weighted-centroid analysis
 * It has a rather complicated schema, that depends on several data points and state.
 */
module.exports = BaseAnalysisFormModel.extend({
  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    var nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'));
    this._columnOptions = new ColumnOptions({}, {
      configModel: this._configModel,
      nodeDefModel: nodeDefModel
    });

    this._filterColumnOptions = new ColumnOptions({}, {
      configModel: this._configModel
    });

    this.listenTo(this._columnOptions, 'columnsFetched', this._setSchema);
    this.listenTo(this._filterColumnOptions, 'columnsFetched', this._setSchema);
    this.listenTo(this._analysisSourceOptionsModel, 'change:fetching', this._setSchema);
    this.on('change:filter_source', this._onFilterSourceChange, this);
    this._onFilterSourceChange();
    this._setSchema();
  },

  _onFilterSourceChange: function () {
    var nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('filter_source'));
    if (nodeDefModel) {
      this._filterColumnOptions.setNode(nodeDefModel);
      this._setSchema();
    }
  },

  getTemplate: function () {
    return template;
  },

  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    var schema = {
      source: this._primarySourceSchemaItem(),
      filter_source: {
        type: 'NodeDataset',
        title: _t('editor.layers.analysis-form.linked-layer'),
        dialogMode: 'float',
        editorAttrs: {
          disabled: this._isFetchingOptions()
        },
        options: this._getSourceOptionsForSource({
          sourceAttrName: 'filter_source',
          ignorePrimarySource: true,
          onlyNodes: true
        })
      },
      column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.source-column'),
        dialogMode: 'float',
        options: this._columnOptions.all()
      },
      filter_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.filter-column'),
        dialogMode: 'float',
        validators: ['required', this._validateFilterColumn.bind(this)],
        options: this._filterColumnOptions.all()
      }
    };

    BaseAnalysisFormModel.prototype._setSchema.call(this, schema);
  },

  _validateFilterColumn: function (value, formValues) {
    var filterColumnValue = formValues.filter_column;
    var columnValue = formValues.column;

    // if we don't have both fields we don't validate
    if (filterColumnValue === void 0 || columnValue === void 0) return null;

    var error = {
      message: _t('editor.layers.analysis-form.should-match')
    };

    var filterColumn = this._filterColumnOptions.findColumn(filterColumnValue);
    var filterColumnType = filterColumn && filterColumn.type;

    var column = this._columnOptions.findColumn(columnValue);
    var columnType = column && column.type;

    if (filterColumnType === columnType) {
      return null; // types match
    }

    return error;
  },

  _getSourceOptionsForSource: function (sourceAttrName, requiredSimpleGeometryType) {
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
        .getSelectOptions(requiredSimpleGeometryType)
        .filter(function (d) {
          // Can't select own layer as source, so exclude it
          return d.val !== sourceId && d.type === 'node';
        });
    }
  },

  _isFetchingOptions: function () {
    return this._analysisSourceOptionsModel.get('fetching');
  }
});
