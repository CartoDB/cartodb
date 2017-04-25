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
    this._initBinds();
    this._setSchema();
    this._fetchColumns();
  },

  _initBinds: function () {
    this.listenTo(this._analysisSourceOptionsModel, 'change:fetching', this._onSourceOptionsFetched);
    this.on('change:target', this._onChangeTarget, this);
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
      source: this._primarySourceSchemaItem(_t('editor.layers.analysis-form.find-nearest.input')),
      target: {
        type: 'NodeDataset',
        title: _t('editor.layers.analysis-form.find-nearest.target'),
        options: this._getSourceOptionsForSource({
          sourceAttrName: 'target'
        }),
        dialogMode: 'float',
        validators: ['required'],
        editorAttrs: {
          disabled: this._isSourceDisabled('target'),
          trackClass: 'track-FindNearest track-simpleDropdown-targetLayer'
        }
      },
      category: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.layers.analysis-form.find-nearest.categorized'),
        editorAttrs: {
          trackClass: 'track-FindNearest track-checkbox-categorizedBy'
        },
        editor: {
          type: 'Select',
          options: this._columnOptions.filterByType('string'),
          dialogMode: 'float',
          editorAttrs: {
            showLabel: false,
            trackClass: 'track-FindNearest track-simpleDropdown-categorizedBy'
          }
        }
      },
      responses: {
        type: 'Number',
        title: _t('editor.layers.analysis-form.find-nearest.max-results'),
        value: 1,
        validators: ['required', {
          type: 'interval',
          min: 1,
          max: MAX_RESPONSES
        }],
        editorAttrs: {
          trackClass: 'track-FindNearest track-numericInput-maxResults'
        }
      }
    });
  },

  _isSourceDisabled: function (sourceAttrName) {
    return this._isPrimarySource(sourceAttrName) || this._isFetchingOptions();
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
  }
});
