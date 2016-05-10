var AddAnalysisBodyView = require('./add-analysis-body-view');
var AnalysisOptionsCollection = require('./analysis-options-collection');
var ErrorView = require('../../error/error-view');
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
    if (!opts.analysisDefinitionNodeModel) throw new Error('analysisDefinitionNodeModel is required');

    this._modalModel = opts.modalModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._analysisDefinitionNodeModel = opts.analysisDefinitionNodeModel;

    this._optionsCollection = new AnalysisOptionsCollection();
    this.model = new cdb.core.Model();

    this.listenTo(this._optionsCollection, 'change:selected', this._onSelectedChange);
    this.listenTo(this.model, 'change:output_geometry_type', this._onOutputGeometryTypeChange);
    this.listenTo(this.model, 'change:output_geometry_type_error', this.render);

    this._analysisDefinitionNodeModel.asyncGetOutputGeometryType(function (err, val) {
      if (err) {
        this.model.set('output_geometry_type_error', err);
      } else {
        this.model.set('output_geometry_type', val);
      }
    }.bind(this), {noCache: true});
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    if (this.model.has('output_geometry_type')) {
      this._renderBodyView();
    } else if (this.model.has('output_geometry_type_error')) {
      this._renderErrorView();
    } else {
      this._renderLoadingView();
    }

    return this;
  },

  _renderBodyView: function () {
    var view = new AddAnalysisBodyView({
      el: this._$body(),
      collection: this._optionsCollection,
      outputGeometry: this.model.get('output_geometry_type')
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

  _onOutputGeometryTypeChange: function (m, outputGeometryType) {
    var optionModels = createAnalysisOptionsModels(outputGeometryType, this._analysisDefinitionNodeModel);
    this._optionsCollection.reset(optionModels);
    this.render();
  },

  _isSelected: function (m) {
    return !!m.get('selected');
  }

});
