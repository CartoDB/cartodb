var _ = require('underscore');
var CoreView = require('backbone/core-view');
var AnalysisCategoryView = require('./analysis-category-pane-view');
var createTemplateTabPane = require('../../tab-pane/create-template-tab-pane');
var template = require('./add-analyses.tpl');
var tabPaneButtonTemplate = require('./tab-pane-button-template.tpl');
var tabPaneTemplate = require('./tab-pane-template.tpl');
var analysesTypes = require('./analyses-types');

/**
 * View to select widget options to create.
 */
module.exports = CoreView.extend({
  className: 'Dialog-content Dialog-content--expanded',

  events: {
    'click .js-add': '_onAddAnalysis'
  },

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');
    if (!opts.analysisOptionsCollection) throw new Error('analysisOptionsCollection is required');
    if (!opts.analysisOptions) throw new Error('analysisOptions is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.queryGeometryModel) throw new Error('queryGeometryModel is required');

    this._modalModel = opts.modalModel;
    this._stackLayoutModel = opts.stackLayoutModel;
    this._analysisOptions = opts.analysisOptions;
    this._analysisOptionsCollection = opts.analysisOptionsCollection;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._queryGeometryModel = opts.queryGeometryModel;

    this.listenTo(this._analysisOptionsCollection, 'change:selected', this._onSelectedChange);
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
          className: 'CDB-NavMenu-item'
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
    }
  },

  _generateTabPaneItems: function () {
    var availableTypes = _.unique(_.keys(this._analysisOptions));

    this._tabPaneItems = _.map(analysesTypes, function (d) {
      if (_.contains(availableTypes, d.type)) {
        return d.createTabPaneItem(this._analysisOptionsCollection, {
          modalModel: this._modalModel,
          stackLayoutModel: this._stackLayoutModel,
          analysisOptionsCollection: this._analysisOptionsCollection,
          layerDefinitionModel: this._layerDefinitionModel,
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
          stackLayoutModel: this._stackLayoutModel,
          modalModel: this._modalModel,
          analysisOptionsCollection: this._analysisOptionsCollection,
          layerDefinitionModel: this._layerDefinitionModel,
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
