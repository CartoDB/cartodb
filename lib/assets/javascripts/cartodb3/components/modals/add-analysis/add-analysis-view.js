var _ = require('underscore');
var CoreView = require('backbone/core-view');
var AnalysisOptionsCollection = require('./analysis-options-collection');
var ScrollView = require('../../scroll/scroll-view');
var ViewFactory = require('../../view-factory');
var renderLoading = require('../../../components/loading/render-loading');
var template = require('./add-analysis-view.tpl');
var analysisOptions = require('./analysis-options');
var AnalysisCategoryView = require('./analysis-category-view');

/**
 * View to add a new analysis node.
 * Expected to be rendered in a modal.
 */
module.exports = CoreView.extend({
  className: 'Dialog-content Dialog-content--expanded',

  events: {
    'click .js-add': '_onAddAnalysis'
  },

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._modalModel = opts.modalModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._analysisDefinitionNodeModel = this._layerDefinitionModel.getAnalysisDefinitionNodeModel();

    this._analysisOptions = analysisOptions(opts.generateAnalysisOptions);

    this._analysisOptionsCollection = new AnalysisOptionsCollection();
    this._analysisOptionsCollection.on('change:selected', this._onSelectedChange, this);
    this.add_related_model(this._analysisOptionsCollection);

    this._queryGeometryModel = this._analysisDefinitionNodeModel.queryGeometryModel;
    this._queryGeometryModel.on('change', this.render, this);
    this.add_related_model(this._queryGeometryModel);

    if (!this._isFetchingGeometry()) {
      this._queryGeometryModel.fetch();
    }

    this._initOptions();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    if (this._isFetchingGeometry()) {
      this._renderLoadingView();
    } else {
      var view = new ScrollView({
        createContentView: function () {
          var items = _.map(this._analysisOptions, function (opts, category) {
            return function () {
              return this._renderCategory(category);
            }.bind(this);
          }, this);
          return ViewFactory.createListView(items);
        }.bind(this)
      });

      this.addView(view);
      this._$body().append(view.render().el);
    }

    return this;
  },

  _renderCategory: function (category) {
    return new AnalysisCategoryView({
      collection: this._analysisOptionsCollection,
      category: category,
      categoryTitle: this._analysisOptions[category].title,
      simpleGeometryType: this._queryGeometryModel.get('simple_geom')
    });
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
  },

  _onAddAnalysis: function () {
    var selectedOptionModel = this._analysisOptionsCollection.find(this._isSelected);

    if (selectedOptionModel) {
      var analysisFormAttrs = selectedOptionModel.getFormAttrs(this._layerDefinitionModel);
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
