var _ = require('underscore');
var CoreView = require('backbone/core-view');
var AnalysisOptionsCollection = require('./analysis-options-collection');
var analysisOptions = require('./analysis-options');
var AnalysisViewPane = require('./analysis-view-pane');
var renderLoading = require('builder/components/loading/render-loading');
var DataServicesApiCheck = require('builder/editor/layers/layer-content-views/analyses/analyses-quota/analyses-quota-info');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'modalModel',
  'configModel',
  'userModel',
  'layerDefinitionModel'
];

/**
 * View to add a new analysis node.
 * Expected to be rendered in a modal.
 */
module.exports = CoreView.extend({
  className: 'Dialog-content Dialog-content--expanded',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._analysisDefinitionNodeModel = this._layerDefinitionModel.getAnalysisDefinitionNodeModel();

    this._queryGeometryModel = this._analysisDefinitionNodeModel.queryGeometryModel;
    this.listenTo(this._queryGeometryModel, 'change', this.render);

    this._analysisOptions = analysisOptions({
      userModel: this._userModel,
      configModel: this._configModel,
      queryGeometryModel: this._queryGeometryModel
    });
    this._analysisOptionsCollection = new AnalysisOptionsCollection();

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
      userModel: this._userModel,
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
