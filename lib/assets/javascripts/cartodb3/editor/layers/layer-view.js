var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./layer.tpl');
var ContextMenuView = require('../../components/context-menu/context-menu-view');
var CustomListCollection = require('../../components/custom-list/custom-list-collection');

/**
 * View for an individual layer definition model.
 */
module.exports = CoreView.extend({

  tagName: 'li',

  className: 'Editor-ListLayer-item js-layer js-sortable',

  events: {
    'click .js-toggle-menu': '_onToggleContextMenuClicked',
    'click .js-title': '_onEditLayer',
    'click .js-toggle': '_onToggleLayerClicked'
  },

  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!_.isFunction(opts.newAnalysesView)) throw new Error('newAnalysesView is required as a function');

    this._stackLayoutModel = opts.stackLayoutModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._newAnalysesView = opts.newAnalysesView;

    this.viewModel = new Backbone.Model();

    this.listenTo(this.model, 'change', this.render);
    this.listenToOnce(this.model, 'destroy', this._onDestroy);
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
      isVisible: m.get('visible'),
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

  _onToggleLayerClicked: function () {
    this.model.toggle();
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
