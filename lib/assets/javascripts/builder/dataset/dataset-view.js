var CoreView = require('backbone/core-view');
var template = require('./dataset.tpl');
var HeaderView = require('./dataset-header/dataset-header-view');
var DatasetContentView = require('./dataset-content/dataset-content-view');
var DatasetOptionsView = require('./dataset-options/dataset-options-view');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'router',
  'modals',
  'editorModel',
  'configModel',
  'userModel',
  'visModel',
  'analysisDefinitionNodeModel',
  'layerDefinitionModel'
];

/**
 *  Remove confirmation dialog
 */
module.exports = CoreView.extend({
  className: 'Editor js-editor',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template({
        url: this._configModel.get('base_url')
      })
    );
    this._initViews();
    return this;
  },

  _initViews: function () {
    var datasetHeaderView = new HeaderView({
      router: this._router,
      modals: this._modals,
      configModel: this._configModel,
      userModel: this._userModel,
      visModel: this._visModel,
      analysisDefinitionNodeModel: this._analysisDefinitionNodeModel,
      layerDefinitionModel: this._layerDefinitionModel
    });
    this.$('.js-info').append(datasetHeaderView.render().el);
    this.addView(datasetHeaderView);

    var datasetContentView = new DatasetContentView({
      modals: this._modals,
      userModel: this._userModel,
      visModel: this._visModel,
      analysisDefinitionNodeModel: this._analysisDefinitionNodeModel,
      configModel: this._configModel
    });
    this.$('.js-table').append(datasetContentView.render().el);
    this.addView(datasetContentView);

    var datasetOptionsView = new DatasetOptionsView({
      onToggleEdition: this._onToggleEdition.bind(this),
      editorModel: this._editorModel,
      router: this._router,
      modals: this._modals,
      configModel: this._configModel,
      userModel: this._userModel,
      visModel: this._visModel,
      analysisDefinitionNodeModel: this._analysisDefinitionNodeModel,
      layerDefinitionModel: this._layerDefinitionModel
    });
    this._getDatasetOptionsElement().append(datasetOptionsView.render().el);
    this.addView(datasetOptionsView);

    var tooltip = new TipsyTooltipView({
      el: this.$('.js-editor-logo'),
      title: function () {
        return _t('back-to-dashboard');
      },
      gravity: 'w'
    });
    this.addView(tooltip);
  },

  _getDatasetOptionsElement: function () {
    return this.$('.js-datasetOptions');
  },

  _onToggleEdition: function () {
    this._getDatasetOptionsElement().toggleClass('is-dark', this._editorModel.isEditing());
  }
});
