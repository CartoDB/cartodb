var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./spatial-markov-trend.tpl');
var ColumnOptions = require('builder/editor/layers/layer-content-views/analyses/column-options');

module.exports = BaseAnalysisFormModel.extend({
  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);
    var nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'));
    this._columnOptions = new ColumnOptions({}, {
      configModel: this._configModel,
      nodeDefModel: nodeDefModel
    });
    this.listenTo(this._columnOptions, 'columnsFetched', this._setSchema);
    this._setSchema();
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
      time_columns: {
        type: 'MultiSelect',
        title: _t('editor.layers.analysis-form.spatial-markov-trend-time-columns'),
        options: this._columnOptions.filterByType(['string', 'number']),
        dialogMode: 'float',
        help: _t('editor.layers.analysis-form.spatial-markov-trend-time-columns-help'),
        editorAttrs: {
          showSearch: true
        }
      }
    };

    BaseAnalysisFormModel.prototype._setSchema.call(this, schema);
  }

});
