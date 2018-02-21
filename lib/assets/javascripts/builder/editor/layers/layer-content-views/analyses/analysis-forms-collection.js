var _ = require('underscore');
var Backbone = require('backbone');
var Analyses = require('builder/data/analyses');
var AnalysesService = require('builder/editor/layers/layer-content-views/analyses/analyses-service');

module.exports = Backbone.Collection.extend({

  initialize: function (models, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.analysisSourceOptionsModel) throw new Error('analysisSourceOptionsModel is required');
    if (!opts.userActions) throw new Error('userActions is required');

    this._configModel = opts.configModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._analysisSourceOptionsModel = opts.analysisSourceOptionsModel;
    this._userActions = opts.userActions;
  },

  model: function (attrs, opts) {
    var self = opts.collection;

    var FormModel = Analyses.findFormModelByType(attrs.type);

    return new FormModel(attrs, {
      configModel: self._configModel,
      analyses: Analyses,
      layerDefinitionModel: self._layerDefinitionModel,
      analysisSourceOptionsModel: self._analysisSourceOptionsModel,
      collection: self,
      parse: true
    });
  },

  resetByLayerDefinition: function () {
    var current = this._layerDefinitionModel.getAnalysisDefinitionNodeModel();

    if (current) {
      var notAppliedAnalysis = AnalysesService.getNotAppliedAnalysis();
      var attrsList = [];

      if (notAppliedAnalysis) {
        attrsList.push(notAppliedAnalysis);
      }

      this._walkAnalysisChain(current, this._layerDefinitionModel, function (nodeDefModel) {
        var attrs = _.extend({ persisted: true }, nodeDefModel.attributes);
        attrsList.push(attrs);
      });

      this.reset(attrsList);
    }
  },

  addHead: function (attrs) {
    AnalysesService.saveNotAppliedAnalysis(attrs);

    this.remove(attrs.id); // if having the same id it's because the existing node is a temporary one,
    return this.add(attrs, { at: 0 }); // so replace it with the new attrs
  },

  deleteNode: function (nodeId) {
    var nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(nodeId);
    if (nodeDefModel) {
      this._userActions.deleteAnalysisNode(nodeId);
    } else {
      this.remove(nodeId);
    }
  },

  removeUselessModels: function () {
    var removed = [];

    this.models.forEach(function (model) {
      var useless = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(model.id) === undefined;
      if (useless) {
        removed.push(model);
      }
    }, this);

    if (removed.length > 0) {
      this.remove(removed, { silent: true });
      this.trigger('destroyedModels');
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
