var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./data-layer.tpl');
var ContextMenuView = require('../../../components/context-menu/context-menu-view');
var CustomListCollection = require('../../../components/custom-list/custom-list-collection');

module.exports = CoreView.extend({

  tagName: 'li',

  className: 'Editor-ListLayer-item js-layer js-sortable-item',

  events: {
    'click .js-toggle-menu': '_onToggleContextMenuClicked',
    'click .js-thumbnail': '_onEditLayer',
    'click .js-title': '_onEditLayer',
    'click .js-toggle': '_onToggleLayerClicked'
  },

  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.newAnalysesView) throw new Error('newAnalysesView is required');

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

    this.$el.toggleClass('is-unavailable', m.isNew());

    this._toggleClickEventsOnCapturePhase('remove'); // remove any if rendered previously
    if (m.isNew()) {
      this._toggleClickEventsOnCapturePhase('add');
    }

    if (m.get('source')) {
      var analysesView = this._newAnalysesView(this.$('.js-analyses'), m);
      analysesView.bind('nodeClicked', this._onNodeClicked, this);
      this.addView(analysesView);
      analysesView.render();
    }

    return this;
  },

  _isCollapsed: function () {
    return !!this.viewModel.get('collapsed');
  },

  _onEditLayer: function (e) {
    e.stopPropagation();
    this._stackLayoutModel.nextStep(this.model, 'layer-content');
  },

  _onToggleLayerClicked: function () {
    this.model.toggle();
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

  _disableEventsOnCapturePhase: function (evt) {
    evt.stopPropagation();
    evt.preventDefault();
  },

  _toggleClickEventsOnCapturePhase: function (str) {
    var addOrRemove = str === 'add'
      ? 'add'
      : 'remove';
    this.el[addOrRemove + 'EventListener']('click', this._disableEventsOnCapturePhase, true);
  },

  clean: function () {
    this._toggleClickEventsOnCapturePhase('remove');
    CoreView.prototype.clean.apply(this);
  }
});
