var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./point-in-polygon-form.tpl');

/**
 * Form model for a point-in-polygon
 * It has a rather complicated schema, that depends on several data points and state.
 */
module.exports = BaseAnalysisFormModel.extend({

  initialize: function (attrs, opts) {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this.listenTo(this._analysisSourceOptionsModel, 'change:fetching', this._updateSchema);

    this._updateSchema();
    this.on('change', this._onChange, this);
  },

  getTemplate: function () {
    return template;
  },

  _updateSchema: function () {
    this._setSchema({
      points_source: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.points_source'),
        options: this._getSourceOptionsForSource('points_source', 'point'),
        editorAttrs: {
          disabled: this._isSourceDisabled('points_source')
        }
      },
      polygons_source: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.polygons_source'),
        options: this._getSourceOptionsForSource('polygons_source', 'polygon'),
        editorAttrs: {
          disabled: this._isSourceDisabled('polygons_source')
        }
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

  _getSourceOptionsForSource: function (sourceAttrName, requiredSimpleGeometryType) {
    var currentSource = this.get(sourceAttrName);

    if (this._isPrimarySource(sourceAttrName)) {
      return [currentSource];
    } else if (this._isFetchingOptions()) {
      return [{
        val: currentSource,
        label: 'loading…'
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
  },

  _onChange: function () {
    var changedSourceId = this.changed.points_source || this.changed.polygons_source;
    if (changedSourceId) {
      this._analysisSourceOptionsModel.createSourceNodeUnlessExisting(changedSourceId);
    }
  }

});
