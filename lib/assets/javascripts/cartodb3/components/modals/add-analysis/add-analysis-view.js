var AddAnalysisBodyView = require('./add-analysis-body-view');
var createAnalysisOptionsModels = require('./create-analysis-options-models');
var AnalysisOptionsCollection = require('./analysis-options-collection');
var template = require('./add-analysis-view.tpl');

/**
 * View to add new widgets.
 * Expected to be rendered in a modal.
 *
 * The widget options to choose from needs to be calculated from columns derived from the available layers,
 * which may be async, so the actual options can not be created until after the layers' columns are fetched.
 */
module.exports = cdb.core.View.extend({
  className: 'Dialog-content Dialog-content--expanded',

  events: {
    'click .js-add': '_onAddAnalysis'
  },

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.analysisDefinitionsCollection) throw new Error('analysisDefinitionsCollection is required');
    if (!opts.analysisDefinitionNodeModel) throw new Error('analysisDefinitionNodeModel is required');

    this._modalModel = opts.modalModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._analysisDefinitionsCollection = opts.analysisDefinitionsCollection;

    var optionModels = createAnalysisOptionsModels(opts.analysisDefinitionNodeModel);
    this._optionsCollection = new AnalysisOptionsCollection(optionModels);

    this.listenTo(this._optionsCollection, 'change:selected', this._onSelectedChange);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    var view = new AddAnalysisBodyView({
      el: this.$('.js-body'),
      collection: this._optionsCollection
    });
    view.render();
    this.addView(view);

    return this;
  },

  _onAddAnalysis: function () {
    var selectedOptionModel = this._optionsCollection.find(this._isSelected);

    if (selectedOptionModel) {
      var attrs = selectedOptionModel.get('node_attrs');
      var nodeDef = this._analysisDefinitionsCollection.createNode(attrs);
      this._layerDefinitionModel.save({ source: nodeDef.id });

      this._modalModel.destroy();
    }
  },

  _onSelectedChange: function () {
    this.$('.js-add').toggleClass('is-disabled', !this._optionsCollection.any(this._isSelected));
  },

  _isSelected: function (m) {
    return !!m.get('selected');
  }

});
