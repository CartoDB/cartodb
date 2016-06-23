var CoreView = require('backbone/core-view');
var template = require('./analyses-workflow.tpl');
var ListView = require('./analyses-workflow-list-view');
var ScrollView = require('../../../../components/scroll/scroll-view');

module.exports = CoreView.extend({

  events: {
    'click .js-delete': '_deleteAnalysis'
  },

  initialize: function (opts) {
    if (!opts.analysis) throw new Error('analysis is required');
    if (!opts.analysisFormsCollection) throw new Error('analysisFormsCollection is required');
    if (!opts.viewModel) throw new Error('viewModel is required');
    if (!opts.layerId) throw new Error('layerId is required');

    this.analysis = opts.analysis;
    this.analysisFormsCollection = opts.analysisFormsCollection;
    this.viewModel = opts.viewModel;
    this._layerId = opts.layerId;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(this._html());
    this._addScrollView();
    return this;
  },

  _html: function () {
    return template({
      selectedNodeId: this.viewModel.get('selectedNodeId')
    });
  },

  _addScrollView: function () {
    var self = this;
    var view = new ScrollView({
      type: 'horizontal',
      createContentView: function () {
        return new ListView({
          analysis: self.analysis,
          analysisFormsCollection: self.analysisFormsCollection,
          model: self.viewModel,
          layerId: self._layerId
        });
      }
    });

    this.$('.js-content').append(view.render().el);
    this.addView(view);
  },

  _deleteAnalysis: function () {
    this.analysisFormsCollection.deleteNode(this.viewModel.get('selectedNodeId'));
  }

});
