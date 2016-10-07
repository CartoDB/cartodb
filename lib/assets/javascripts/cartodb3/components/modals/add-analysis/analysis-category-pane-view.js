var CoreView = require('backbone/core-view');
var ScrollView = require('../../scroll/scroll-view');
var renderLoading = require('../../../components/loading/render-loading');
var analysisOptions = require('./analysis-options');
var AnalysisCategoryView = require('./analysis-category-view');

/**
 * View to add a new analysis node.
 * Expected to be rendered in a modal.
 */
module.exports = CoreView.extend({
  className: 'Dialog-content Dialog-content--expanded',

  initialize: function (opts) {
    if (!opts.analysisOptionsCollection) throw new Error('analysisOptionsCollection is required');
    if (!opts.analysisType) throw new Error('analysisType is required');
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.queryGeometryModel) throw new Error('queryGeometryModel is required');

    this._queryGeometryModel = opts.queryGeometryModel;
    this._analysisOptionsCollection = opts.analysisOptionsCollection;
    this._analysisType = opts.analysisType;
    this._modalModel = opts.modalModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._analysisDefinitionNodeModel = this._layerDefinitionModel.getAnalysisDefinitionNodeModel();

    this._analysisOptions = analysisOptions(opts.generateAnalysisOptions);
  },

  render: function () {
    this.clearSubViews();

    var view = new ScrollView({
      createContentView: function () {
        return new AnalysisCategoryView({
          collection: this._analysisOptionsCollection,
          category: this._analysisType === 'all' ? '' : this._analysisType,
          categoryTitle: this._analysisType === 'all' ? 'all' : this._analysisOptions[this._analysisType].label,
          simpleGeometryType: this._queryGeometryModel.get('simple_geom')
        });
      }.bind(this)
    });

    this.addView(view);
    this.$el.append(view.render().el);

    return this;
  },

  _renderLoadingView: function () {
    this._$body().html(
      renderLoading({
        title: _t('components.modals.add-analysis.loading-title')
      })
    );
  }
});
