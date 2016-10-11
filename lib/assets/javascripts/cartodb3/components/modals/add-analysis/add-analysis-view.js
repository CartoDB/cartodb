var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var AnalysisOptionsCollection = require('./analysis-options-collection');
var analysisOptions = require('./analysis-options');
var StackLayoutView = require('../../../components/stack-layout/stack-layout-view');
var AnalysisViewPane = require('./analysis-view-pane');
var AnalysisInfoPane = require('./analysis-info-pane');
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

    if (this._isFetchingGeometry()) {
      this._renderLoadingView();
    } else {
      var stackViewCollection = new Backbone.Collection([{
        createStackView: function (stackLayoutModel, opts) {
          return new AnalysisViewPane({
            modalModel: this._modalModel,
            stackLayoutModel: stackLayoutModel,
            analysisOptions: this._analysisOptions,
            analysisOptionsCollection: this._analysisOptionsCollection,
            layerDefinitionModel: this._layerDefinitionModel,
            queryGeometryModel: this._queryGeometryModel
          });
        }.bind(this)
      }, {
        createStackView: function (stackLayoutModel, opts) {
          return new AnalysisInfoPane({
            stackLayoutModel: stackLayoutModel,
            collection: this._analysisOptionsCollection
          });
        }.bind(this)
      }]);

      this._stackLayoutView = new StackLayoutView({
        className: 'Editor-content',
        collection: stackViewCollection
      });

      this.$el.append(this._stackLayoutView.render().$el);
      this.addView(this._stackLayoutView);
    }

    return this;
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

  _$body: function () {
    return this.$('.js-body');
  },

  _renderLoadingView: function () {
    this._$body().html(
      renderLoading({
        title: _t('components.modals.add-widgets.loading-title')
      })
    );
  }
});
