var AddAnalysisBodyView = require('./add-analysis-body-view');
var AnalysisOptionsCollection = require('./analysis-options-collection');
var createAnalysisOptionsModels = require('./create-analysis-options-models');
var renderLoading = require('../../../components/loading/render-loading');
var template = require('./add-analysis-view.tpl');

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
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._modalModel = opts.modalModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._analysisDefinitionNodeModel = this._layerDefinitionModel.getAnalysisDefinitionNodeModel();

    this._optionsCollection = new AnalysisOptionsCollection();

    this.listenTo(this._optionsCollection, 'change:selected', this._onSelectedChange);

    this._querySchemaModel = this._analysisDefinitionNodeModel.querySchemaModel;
    this._querySchemaModel.on('change', this._onQuerySchemaChange, this);
    this.add_related_model(this._querySchemaModel);
    this._querySchemaModel.fetch();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    if (this._isFetching()) {
      this._renderLoadingView();
    } else {
      this._renderBodyView();
    }

    return this;
  },

  _renderBodyView: function () {
    var view = new AddAnalysisBodyView({
      el: this._$body(),
      collection: this._optionsCollection
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

  _$body: function () {
    return this.$('.js-body');
  },

  _onQuerySchemaChange: function () {
    if (this._isFetching()) return;

    var optionModels = createAnalysisOptionsModels(this._simpleGeometryType(), this._analysisDefinitionNodeModel);
    this._optionsCollection.reset(optionModels);
    this.render();
  },

  _simpleGeometryType: function () {
    var geometry = this._querySchemaModel.getGeometry();
    if (geometry) {
      return geometry.getSimpleType();
    }
  },

  _isFetching: function () {
    return this._querySchemaModel.get('status') === 'fetching';
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

  _isSelected: function (m) {
    return !!m.get('selected');
  }

});
