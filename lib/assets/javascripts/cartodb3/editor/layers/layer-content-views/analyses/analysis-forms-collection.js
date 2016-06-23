var _ = require('underscore');
var Backbone = require('backbone');

var AreaOfInfluenceFormModel = require('./analysis-form-models/area-of-influence-form-model');
var WeightedCentroidModelFormModel = require('./analysis-form-models/weighted-centroid-form-model');
var KmeansFormModel = require('./analysis-form-models/kmeans-form-model');
var MoranFormModel = require('./analysis-form-models/moran-form-model');
var FallbackFormModel = require('./analysis-form-models/fallback-form-model');
var PointInPolygonFormModel = require('./analysis-form-models/point-in-polygon-form-model');
var IntersectionFormModel = require('./analysis-form-models/intersection-form-model');
var UnknownTypeFormModel = require('./analysis-form-models/unknown-type-form-model');

var TYPE_TO_ANALYSIS_FORM_MODELS_MAP = {
  'buffer': AreaOfInfluenceFormModel,
  'trade-area': AreaOfInfluenceFormModel,
  'kmeans': KmeansFormModel,
  'moran': MoranFormModel,
  'weighted-centroid': WeightedCentroidModelFormModel,
  'point-in-polygon': PointInPolygonFormModel,
  'intersection': IntersectionFormModel,
  'aggregate-intersection': IntersectionFormModel
};

module.exports = Backbone.Collection.extend({

  initialize: function (models, opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.analysisSourceOptionsModel) throw new Error('analysisSourceOptionsModel is required');
    if (!opts.userActions) throw new Error('userActions is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._analysisSourceOptionsModel = opts.analysisSourceOptionsModel;
    this._userActions = opts.userActions;
  },

  model: function (attrs, opts) {
    var self = opts.collection;
    var FormModel = attrs.type
      ? TYPE_TO_ANALYSIS_FORM_MODELS_MAP[attrs.type] || FallbackFormModel
      : UnknownTypeFormModel;

    return new FormModel(attrs, {
      layerDefinitionModel: self._layerDefinitionModel,
      analysisSourceOptionsModel: self._analysisSourceOptionsModel,
      collection: self,
      parse: true
    });
  },

  resetByLayerDefinition: function () {
    var current = this._layerDefinitionModel.getAnalysisDefinitionNodeModel();
    if (current) {
      var attrsList = [];
      this._walkAnalysisChain(current, this._layerDefinitionModel, function (nodeDefModel) {
        var attrs = _.extend({persisted: true}, nodeDefModel.attributes);
        attrsList.push(attrs);
      });
      this.reset(attrsList);
    }
  },

  addHead: function (attrs) {
    this.remove(attrs.id); // if having the same id it's because the existing node is a temporary one,
    var formModel = this.add(attrs, {at: 0}); // so replace it with the new attrs
    if (formModel.isValid()) {
      this._userActions.updateOrCreateAnalysis(formModel);
    }
    return formModel;
  },

  deleteNode: function (nodeId) {
    var nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(nodeId);
    if (nodeDefModel) {
      this._userActions.deleteAnalysisNode(nodeId);
    } else {
      this.remove(nodeId);
    }
  },

  _walkAnalysisChain: function (current, layerDefModel, visitorFn) {
    if (!current.hasPrimarySource()) return;

    visitorFn.call(this, current);

    var next = current.getPrimarySource();
    if (layerDefModel.isOwnerOfAnalysisNode(next)) {
      this._walkAnalysisChain(next, layerDefModel, visitorFn);
    }
  }

});
