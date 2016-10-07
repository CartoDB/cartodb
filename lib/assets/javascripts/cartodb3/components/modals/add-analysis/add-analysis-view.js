var _ = require('underscore');
var CoreView = require('backbone/core-view');
var AnalysisOptionsCollection = require('./analysis-options-collection');
var analysisOptions = require('./analysis-options');
var analysesTypes = require('./analyses-types');
var template = require('./add-analyses.tpl');
var BodyView = require('./body-view');
var renderLoading = require('../../../components/loading/render-loading');

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
    this.listenTo(this._analysisOptionsCollection, 'change:selected', this._onSelectedChange);

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
      this._renderBodyView();
    }

    return this;
  },

  _renderLoadingView: function () {
    this._$body().html(
      renderLoading({
        title: _t('components.modals.add-widgets.loading-title')
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

  _renderBodyView: function () {
    var view = new BodyView({
      el: this._$body(),
      analysesTypes: analysesTypes,
      modalModel: this._modalModel,
      analysisOptionsCollection: this._analysisOptionsCollection,
      analysisOptions: this._analysisOptions,
      layerDefinitionModel: this._layerDefinitionModel,
      queryGeometryModel: this._queryGeometryModel
    });

    this.addView(view.render());
  },

  _onSelectedChange: function () {
    this.$('.js-add').toggleClass('is-disabled', !this._analysisOptionsCollection.any(this._isSelected));
  },

  _isSelected: function (m) {
    return !!m.get('selected');
  }
});
