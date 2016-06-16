var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./layer.tpl');
var ContextMenuView = require('../../../components/context-menu/context-menu-view');
var CustomListCollection = require('../../../components/custom-list/custom-list-collection');
var LayerAnalysisViewFactory = require('../layer-analysis-view-factory');

/**
 * View for an individual layer definition model.
 */
module.exports = CoreView.extend({

  tagName: 'li',

  className: 'Editor-ListLayer-item js-layer js-sortable',

  events: {
    'click .js-toggle-menu': '_onToggleContextMenuClicked',
    'click .js-title': '_onEditLayer',
    'click .js-thumbnail': '_onEditLayer'
  },

  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.analysis) throw new Error('analysis is required');

    this._stackLayoutModel = opts.stackLayoutModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;

    this.viewModel = new Backbone.Model();

    this.listenTo(this.model, 'change', this.render);
    this.listenToOnce(this.model, 'destroy', this._onDestroy);

    // TODO: Move to LayerAnalysisView
    this._layerAnalysisViewFactory = new LayerAnalysisViewFactory(opts.analysisDefinitionNodesCollection, opts.analysis);
    this.listenTo(this.viewModel, 'change:collapsed', this.render);
  },

  render: function () {
    this.clearSubViews();

    var m = this.model;

    this.$el.html(template({
      layerId: m.id,
      title: m.getName(),
      letter: m.get('letter'),
      color: m.get('color'),
      isCollapsed: this._isCollapsed(),
      numberOfAnalyses: m.getNumberOfAnalyses() - 1 // Substracting one to skip "source" type analyses (datasets)
    }));

    if (m.get('source')) {
      var view = this._newAnalysesView(this.$('.js-analyses'), m);
      view.bind('nodeClicked', this._onNodeClicked, this);
      this.addView(view);
      view.render();
    }

    return this;
  },

  _isCollapsed: function () {
    return !!this.viewModel.get('collapsed');
  },

  _onEditLayer: function (e) {
    e.stopPropagation();

    if (this._preventEditClick) {
      this._preventEditClick = false;
      return;
    }
    this._stackLayoutModel.nextStep(this.model, 'layer-content');
  },

  _onNodeClicked: function (nodeDefModel) {
    this._stackLayoutModel.nextStep(this.model, 'layer-content', nodeDefModel.id);
  },

  _onToggleContextMenuClicked: function (event) {
    if (this._hasContextMenu()) {
      this._hideContextMenu();
    } else {
      this._showContextMenu({
        x: event.pageX,
        y: event.pageY
      });
    }
  },

  _hasContextMenu: function () {
    return this._menuView;
  },

  _hideContextMenu: function () {
    this._menuView.remove();
    this.removeView(this._menuView);
    delete this._menuView;
  },

  _showContextMenu: function (position) {
    var menuItems = new CustomListCollection([{
      label: this._isCollapsed() ? 'Expand' : 'Collapse',
      val: 'collapse-expand-layer'
    }]);
    if (this._layerCanBeDeleted()) {
      menuItems.add({
        label: 'Delete layer…',
        val: 'delete-layer',
        destructive: true
      });
    }

    var triggerElementID = 'context-menu-trigger-' + this.model.cid;
    this.$('.js-toggle-menu').attr('id', triggerElementID);
    this._menuView = new ContextMenuView({
      collection: menuItems,
      triggerElementID: triggerElementID,
      position: position
    });

    menuItems.bind('change:selected', function (menuItem) {
      if (menuItem.get('val') === 'delete-layer') {
        this.model.destroy();
      }
      if (menuItem.get('val') === 'collapse-expand-layer') {
        this.viewModel.set('collapsed', !this.viewModel.get('collapsed'));
      }
    }, this);

    this._menuView.model.bind('change:visible', function (model, isContextMenuVisible) {
      if (this._hasContextMenu() && !isContextMenuVisible) {
        this._hideContextMenu();
      }
    }, this);

    this._menuView.show();
    this.addView(this._menuView);
  },

  _layerCanBeDeleted: function () {
    return this._layerDefinitionsCollection.getNumberOfDataLayers() > 1;
  },

  _onDestroy: function () {
    this.clean();
  },

  clean: function () {
    CoreView.prototype.clean.apply(this);
  }
});
