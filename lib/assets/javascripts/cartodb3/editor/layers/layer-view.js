var _ = require('underscore');
var cdb = require('cartodb.js');
var template = require('./layer.tpl');
var ContextMenuView = require('../../components/context-menu/context-menu-view');
var CustomListCollection = require('../../components/custom-list/custom-list-collection');

/**
 * View for an individual layer definition model.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  className: 'Editor-ListLayer-item js-layer js-sortable',

  events: {
    'click .js-toggle-menu': '_onToggleContextMenuClicked',
    'click .js-title': '_onEditLayer'
  },

  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!_.isFunction(opts.newAnalysesView)) throw new Error('newAnalysesView is required as a function');

    this._stackLayoutModel = opts.stackLayoutModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._newAnalysesView = opts.newAnalysesView;

    this.listenTo(this.model, 'change', this.render);
    this.listenToOnce(this.model, 'destroy', this._onDestroy);
  },

  render: function () {
    this.clearSubViews();

    var m = this.model;

    this.$el.html(template({
      layerId: m.id,
      title: m.getName(),
      letter: m.get('letter')
    }));

    if (m.get('source')) {
      var view = this._newAnalysesView(this.$('.js-analyses'), m);
      view.bind('nodeClicked', this._onNodeClicked, this);
      this.addView(view);
      view.render();
    }

    return this;
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
      this._showContextMenu(event);
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

  _showContextMenu: function (event) {
    var menuItems = new CustomListCollection([{
      label: 'Action (TBD)',
      val: ''
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
      position: {
        x: event.pageX,
        y: event.pageY
      }
    });

    menuItems.bind('change:selected', function (menuItem) {
      if (menuItem.get('val') === 'delete-layer') {
        this.model.destroy();
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
    cdb.core.View.prototype.clean.apply(this);
  }
});
