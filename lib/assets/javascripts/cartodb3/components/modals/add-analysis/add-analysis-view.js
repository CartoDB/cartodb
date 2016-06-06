var _ = require('underscore');
var AnalysisOptionsCollection = require('./analysis-options-collection');
var renderLoading = require('../../../components/loading/render-loading');
var template = require('./add-analysis-view.tpl');
var analysisOptions = require('./analysis-options');
var AnalysisCategoryView = require('./analysis-category-view');

/**
 * View to add a new analysis node.
 * Expected to be rendered in a modal.
 */
module.exports = cdb.core.View.extend({
  className: 'Dialog-content Dialog-content--expanded',

  events: {
    'click .js-add': '_onAddAnalysis'
  },

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.analysisDefinitionNodeModel) throw new Error('analysisDefinitionNodeModel is required');

    this._modalModel = opts.modalModel;
    this._analysisDefinitionNodeModel = opts.analysisDefinitionNodeModel;

    this._analysisOptions = analysisOptions(opts.generateAnalysisOptions);

    this._analysisOptionsCollection = new AnalysisOptionsCollection();
    this._analysisOptionsCollection.on('change:selected', this._onSelectedChange, this);
    this.add_related_model(this._analysisOptionsCollection);

    this._querySchemaModel = this._analysisDefinitionNodeModel.querySchemaModel;
    this._querySchemaModel.on('change', this.render, this);
    this.add_related_model(this._querySchemaModel);

    if (!this._isFetchingQueryShema()) {
      this._querySchemaModel.fetch();
    }

    this._initOptions();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    if (this._isFetchingQueryShema()) {
      this._renderLoadingView();
    } else {
      Object.keys(this._analysisOptions).forEach(this._renderCategory, this);
    }

    return this;
  },

  _renderCategory: function (category) {
    var view = new AnalysisCategoryView({
      collection: this._analysisOptionsCollection,
      category: category,
      categoryTitle: this._analysisOptions[category].title,
      simpleGeometryType: this._simpleGeometryType()
    });
    this.addView(view);
    this._$body().append(view.render().el);
  },

  _renderLoadingView: function () {
    this._$body().html(
      renderLoading({
        title: _t('components.modals.add-analysis.loading-title')
      })
    );
  },

  _$body: function () {
    return this.$('.js-body');
  },

  _simpleGeometryType: function () {
    var geometry = this._querySchemaModel.getGeometry();
    if (geometry) {
      return geometry.getSimpleType();
    }
  },

  _isFetchingQueryShema: function () {
    return this._querySchemaModel.get('status') === 'fetching';
  },

  _initOptions: function () {
    // Flatten the options hierarchy to a flat array structure that's easier to handle programmatically.
    var modelsAttrs = _.reduce(Object.keys(this._analysisOptions), function (memo, category) {
      var categoryDef = this._analysisOptions[category];
      categoryDef.analyses.forEach(function (d) {
        memo.push(_.extend({}, d, {category: category}));
      });

      return memo;
    }, [], this);

    this._analysisOptionsCollection.reset(modelsAttrs);
  },

  _onAddAnalysis: function () {
    var selectedOptionModel = this._analysisOptionsCollection.find(this._isSelected);

    if (selectedOptionModel) {
      var analysisFormAttrs = selectedOptionModel.getFormAttrs(this._analysisDefinitionNodeModel.id, this._simpleGeometryType());
      this._modalModel.destroy(analysisFormAttrs);
    }
  },

  _onSelectedChange: function () {
    this.$('.js-add').toggleClass('is-disabled', !this._analysisOptionsCollection.any(this._isSelected));
  },

  _isSelected: function (m) {
    return !!m.get('selected');
  }

});
