var _ = require('underscore');
var CoreView = require('backbone/core-view');
var AnalysisCategoryView = require('./analysis-category-pane-view');
var createTemplateTabPane = require('builder/components/tab-pane/create-template-tab-pane');
var template = require('./add-analyses.tpl');
var tabPaneButtonTemplate = require('./tab-pane-button-template.tpl');
var tabPaneTemplate = require('./tab-pane-template.tpl');
var analysesTypes = require('./analyses-types');
var Router = require('builder/routes/router');

/**
 * View to select the analysis to create.
 */
module.exports = CoreView.extend({
  className: 'Dialog-content Dialog-content--expanded',

  events: {
    'click .js-add': '_onAddAnalysis'
  },

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.analysisOptionsCollection) throw new Error('analysisOptionsCollection is required');
    if (!opts.analysisOptions) throw new Error('analysisOptions is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.queryGeometryModel) throw new Error('queryGeometryModel is required');

    this._modalModel = opts.modalModel;
    this._analysisOptions = opts.analysisOptions;
    this._analysisOptionsCollection = opts.analysisOptionsCollection;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._queryGeometryModel = opts.queryGeometryModel;

    this.listenTo(this._analysisOptionsCollection, 'change:selected', this._toggleAddButton);
    this._generateTabPaneItems();
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template());

    var options = {
      tabPaneOptions: {
        template: tabPaneTemplate,
        tabPaneItemOptions: {
          tagName: 'li',
          klassName: 'CDB-NavMenu-item'
        }
      },
      tabPaneTemplateOptions: {
        tagName: 'button',
        className: 'CDB-NavMenu-link u-upperCase',
        template: tabPaneButtonTemplate
      }
    };

    this._tabPane = createTemplateTabPane(this._tabPaneItems, options);
    this.addView(this._tabPane);
    this._$body().append(this._tabPane.render().el);
    return this;
  },

  goToTabItem: function (tabItemName) {
    var tabItem = _.first(this._tabPane.collection.where({ name: tabItemName }));
    if (tabItem) {
      tabItem.set('selected', true);
      this._toggleAddButton(); // set the right state for the add button
    }
  },

  _generateTabPaneItems: function () {
    var availableTypes = _.unique(_.keys(this._analysisOptions));

    this._tabPaneItems = _.map(analysesTypes(this._analysisOptions), function (d) {
      if (_.contains(availableTypes, d.type)) {
        return d.createTabPaneItem(this._analysisOptionsCollection, {
          modalModel: this._modalModel,
          analysisOptionsCollection: this._analysisOptionsCollection,
          queryGeometryModel: this._queryGeometryModel
        });
      }
    }.bind(this));

    this._tabPaneItems.unshift({
      label: _t('analysis-category.all'),
      name: 'all',
      createContentView: function () {
        return new AnalysisCategoryView({
          analysisType: 'all',
          modalModel: this._modalModel,
          analysisOptions: this._analysisOptions,
          analysisOptionsCollection: this._analysisOptionsCollection,
          queryGeometryModel: this._queryGeometryModel
        });
      }.bind(this)
    });
  },

  _$body: function () {
    return this.$('.js-body');
  },

  _onAddAnalysis: function () {
    var selectedOptionModel = this._analysisOptionsCollection.find(this._isSelected);
    var layerDefinitionModel = this._layerDefinitionModel;

    if (selectedOptionModel) {
      var analysisFormAttrs = selectedOptionModel.getFormAttrs(layerDefinitionModel);
      this._modalModel.destroy(analysisFormAttrs);
      Router.goToAnalysisNode(layerDefinitionModel.get('id'), analysisFormAttrs.id);
    }
  },

  _toggleAddButton: function () {
    this.$('.js-add').toggleClass('is-disabled', !this._analysisOptionsCollection.any(this._isSelected));
  },

  _isSelected: function (m) {
    return !!m.get('selected');
  }
});
