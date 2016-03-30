var AddAnalysisBodyView = require('./add-analysis-body-view');
var AnalysisOptionsCollection = require('./analysis-options-collection');
var ErrorView = require('../../error/error-view');
var createAnalysisOptionsModels = require('./create-analysis-options-models');
var renderLoading = require('../../../components/loading/render-loading');
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
    if (!opts.analysisDefinitionNodeModel) throw new Error('analysisDefinitionNodeModel is required');

    this._modalModel = opts.modalModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._analysisDefinitionNodeModel = opts.analysisDefinitionNodeModel;

    this._optionsCollection = new AnalysisOptionsCollection();

    this.listenTo(this._optionsCollection, 'change:selected', this._onSelectedChange);

    var retryIfRejected = this._analysisDefinitionNodeModel.getOutputGeometryType().state() !== 'resolved';
    this._analysisDefinitionNodeModel
      .getOutputGeometryType(retryIfRejected)
      .done(this._whenOutputGeometryTypeIsResolved.bind(this))
      .fail(this.render.bind(this));
  },

  render: function (outputGeometry) {
    this.clearSubViews();
    this.$el.html(template());

    switch (this._analysisDefinitionNodeModel.getOutputGeometryType().state()) {
      case 'pending':
        this._renderLoadingView();
        break;
      case 'rejected':
        this._renderErrorView();
        break;
      default:
        this._renderBodyView(outputGeometry);
    }

    return this;
  },

  _renderBodyView: function (outputGeometry) {
    var view = new AddAnalysisBodyView({
      el: this._$body(),
      collection: this._optionsCollection,
      outputGeometry: outputGeometry
    });
    this.addView(view.render());
  },

  _renderLoadingView: function () {
    this._$body().html(
      renderLoading({
        title: _t('components.modals.add-analysis.loading-title')
      })
    );
  },

  _renderErrorView: function () {
    var view = new ErrorView();
    this._$body().append(view.render().el);
    this.addView(view);
  },

  _$body: function () {
    return this.$('.js-body');
  },

  _onAddAnalysis: function () {
    var selectedOptionModel = this._optionsCollection.find(this._isSelected);

    if (selectedOptionModel) {
      var attrs = selectedOptionModel.get('node_attrs');
      var nodeModel = this._layerDefinitionModel.createNewAnalysisNode(attrs);
      this._modalModel.destroy(nodeModel);
    }
  },

  _onSelectedChange: function () {
    this.$('.js-add').toggleClass('is-disabled', !this._optionsCollection.any(this._isSelected));
  },

  _whenOutputGeometryTypeIsResolved: function (outputGeometryType) {
    var optionModels = createAnalysisOptionsModels(outputGeometryType, this._analysisDefinitionNodeModel);
    this._optionsCollection.reset(optionModels);
    this.render();
  },

  _isSelected: function (m) {
    return !!m.get('selected');
  }

});
