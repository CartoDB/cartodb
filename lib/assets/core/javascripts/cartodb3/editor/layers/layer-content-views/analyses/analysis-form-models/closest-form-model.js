var BaseAnalysisFormModel = require('./base-analysis-form-model');
var ColumnOptions = require('../column-options');
var template = require('./closest-form.tpl');

var MAX_RESPONSES = 32;

module.exports = BaseAnalysisFormModel.extend({
  parse: function (attrs) {
    if (!attrs.responses) {
      attrs.responses = 1;
    }

    return attrs;
  },

  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this._resetColumnOptions();
    this.listenTo(this._analysisSourceOptionsModel, 'change:fetching', this._onSourceOptionsFetched);
    this.on('change:target', this._onChangeTarget, this);

    this._setSchema();
    this._fetchColumns();
  },

  getTemplate: function () {
    return template;
  },

  getTemplateData: function () {
    return {};
  },

  _resetColumnOptions: function () {
    this._columnOptions = new ColumnOptions({}, {
      configModel: this._configModel
    });
    this.listenTo(this._columnOptions, 'columnsFetched', this._onColumnsFetched);
  },

  _onSourceOptionsFetched: function () {
    this._setSchema();
  },

  _setSchema: function () {
    BaseAnalysisFormModel.prototype._setSchema.call(this, {
      source: this._primarySourceSchemaItem('x input'),
      target: {
        type: 'NodeDataset',
        title: 'x target',
        options: this._getSourceOptionsForSource('target', '*'),
        dialogMode: 'float',
        validators: ['required'],
        editorAttrs: {
          disabled: this._isSourceDisabled('target')
        }
      },
      category: {
        type: 'EnablerEditor',
        title: '',
        label: 'Categorized',
        editor: {
          type: 'Select',
          options: this._columnOptions.filterByType('string'),
          dialogMode: 'float',
          editorAttrs: {
            showLabel: false
          }
        }
      },
      responses: {
        type: 'Number',
        title: 'x max results',
        value: 1,
        validators: ['required', {
          type: 'interval',
          min: 1,
          max: 25
        }]
      }
    });
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

  _onChangeTarget: function () {
    this.set('category', '');
    this._setSchema();

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

  _onColumnsFetched: function () {
    this._setSchema();
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
