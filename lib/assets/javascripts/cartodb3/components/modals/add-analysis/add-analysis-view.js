var _ = require('underscore');
var CoreView = require('backbone/core-view');
var Analyses = require('../../../data/analyses');
var AnalysisOptionsCollection = require('./analysis-options-collection');
var analysisOptions = require('./analysis-options');
var AnalysisViewPane = require('./analysis-view-pane');
var renderLoading = require('../../../components/loading/render-loading');
var DataServicesApiCheck = require('../../../editor/layers/layer-content-views/analyses/analyses-quota/analyses-quota-info');

/**
 * View to add a new analysis node.
 * Expected to be rendered in a modal.
 */
module.exports = CoreView.extend({
  className: 'Dialog-content Dialog-content--expanded',

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._modalModel = opts.modalModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
    this._analysisDefinitionNodeModel = this._layerDefinitionModel.getAnalysisDefinitionNodeModel();

    this._analysisOptions = analysisOptions(Analyses, this._userModel, this._configModel);
    this._analysisOptionsCollection = new AnalysisOptionsCollection();

    this.add_related_model(this._analysisOptionsCollection);

    this._queryGeometryModel = this._analysisDefinitionNodeModel.queryGeometryModel;
    this._queryGeometryModel.on('change', this.render, this);
    this.add_related_model(this._queryGeometryModel);

    this._dataservicesApiHealth = DataServicesApiCheck.get();

    if (!this._isFetchingGeometry()) {
      this._queryGeometryModel.fetch();
    }

    this._initOptions();
  },

  render: function () {
    this.clearSubViews();

    var render = this.render.bind(this);
    var dsApiNeedsCheck = this._dataservicesApiHealth.needsCheck();
    if (dsApiNeedsCheck) {
      this._dataservicesApiHealth.fetch({
        success: render
      });
    }

    if (this._isFetchingGeometry() || dsApiNeedsCheck) {
      this._renderLoadingView();
    } else {
      this._renderStackView();
    }

    return this;
  },

  _renderLoadingView: function () {
    this.$el.html(
      renderLoading({
        title: _t('components.modals.add-widgets.loading-title')
      })
    );
  },

  _renderStackView: function () {
    var view = new AnalysisViewPane({
      modalModel: this._modalModel,
      analysisOptions: this._analysisOptions,
      analysisOptionsCollection: this._analysisOptionsCollection,
      layerDefinitionModel: this._layerDefinitionModel,
      queryGeometryModel: this._queryGeometryModel
    });

    this.$el.html(view.render().$el);
    this.addView(view);
  },

  _isFetchingGeometry: function () {
    return this._queryGeometryModel.get('status') === 'fetching';
  },

  _initOptions: function () {
    // Flatten the options hierarchy to a flat array structure that's easier to handle programmatically.
    var modelsAttrs = _.reduce(Object.keys(this._analysisOptions), function (memo, category) {
      var categoryDef = this._analysisOptions[category];
      categoryDef.analyses.forEach(function (d) {
        memo.push(_.extend({}, d, { category: category, type: d.nodeAttrs.type }));
      });

      return memo;
    }, [], this);

    this._analysisOptionsCollection.reset(modelsAttrs);
  }
});
