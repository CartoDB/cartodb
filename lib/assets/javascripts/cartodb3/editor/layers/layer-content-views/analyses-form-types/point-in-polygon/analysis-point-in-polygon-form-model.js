var BaseAnalysisFormModel = require('../base-analysis-form-model.js');

/**
 * Form model for a point-in-polygon
 * It has a rather complicated schema, that depends on several data points and state.
 */
module.exports = BaseAnalysisFormModel.extend({

  initialize: function (attrs, opts) {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.analysisSourceOptionsModel) throw new Error('analysisSourceOptionsModel is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._analysisSourceOptionsModel = opts.analysisSourceOptionsModel;

    this.listenTo(this._analysisSourceOptionsModel, 'change:fetching', this._updateSchema);
    this._analysisSourceOptionsModel.fetch();

    this._updateSchema();
  },

  validate: function (attrs, opts) {
    return this._analysisDefinitionNodeModel.validate(this.attributes, opts);
  },

  _updateSchema: function () {
    this.schema = {
      points_source: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.points_source'),
        options: this._getSourceOptionsForSource('points_source', 'point')
      },
      polygons_source: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.polygons_source'),
        options: this._getSourceOptionsForSource('polygons_source', 'polygon')
      }
    };
    this.trigger('changeSchema', this);
  },

  _getSourceOptionsForSource: function (sourceAttrName, requiredGeometryType) {
    var currentSource = this.get(sourceAttrName);

    if (sourceAttrName === this.get('primary_source_name')) {
      // Primary source should always depend on prev step in the analysis chain; don't allow to change it
      return [currentSource];
    } else if (this._analysisSourceOptionsModel.get('fetching')) {
      return [{
        val: currentSource,
        label: 'loading…'
      }];
    } else {
      var sourceId = this._layerDefinitionModel.get('source');
      return this._analysisSourceOptionsModel
        .getSelectOptions(requiredGeometryType)
        .filter(function (d) {
          // Can't select own layer as source, so exclude it
          return d.val !== sourceId;
        });
    }
  },

  /**
   * @override {BaseAnalysisFormModel.prototype._onChange}
   */
  _onChange: function () {
    var changedSourceId = this.changed.points_source || this.changed.polygons_source;
    if (changedSourceId) {
      // Make sure the new selected source exists before propagating changes to the real node model
      this._analysisSourceOptionsModel.createSourceNodeUnlessExisting(changedSourceId);
    }

    BaseAnalysisFormModel.prototype._onChange.apply(this, arguments);
  }

});
