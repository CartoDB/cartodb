var CoreView = require('backbone/core-view');
var template = require('./basemap-mosaic-remove.tpl');
var CustomListCollection = require('builder/components/custom-list/custom-list-collection');
var ContextMenuView = require('builder/components/context-menu/context-menu-view');

module.exports = CoreView.extend({

  tagName: 'span',
  className: 'Mosaic-remove CDB-Shape-threePoints is-white is-small js-Mosaic-remove',

  events: {
    'click': '_onToggleContextMenuClicked'
  },

  initialize: function (opts) {
    if (!opts.basemapsCollection) throw new Error('basemapsCollection is required');

    this._basemapsCollection = opts.basemapsCollection;
  },

  render: function () {
    this.$el.html(template());

    return this;
  },

  _hasContextMenu: function () {
    return this._menuView;
  },

  _hideContextMenu: function () {
    this.removeView(this._menuView);
    this._menuView.clean();
    delete this._menuView;
  },

  _showContextMenu: function (position) {
    this._menuItems = new CustomListCollection([{
      label: _t('editor.layers.basemap.remove-baselayer'),
      val: 'remove-baselayer',
      destructive: true
    }]);

    var triggerElementID = 'context-menu-trigger-' + this.model.cid;
    this.$('.js-Mosaic-remove').attr('id', triggerElementID);
    this._menuView = new ContextMenuView({
      collection: this._menuItems,
      triggerElementID: triggerElementID,
      position: position
    });

    this._menuItems.bind('change:selected', function (menuItem) {
      if (menuItem.get('val') === 'remove-baselayer') {
        this._deleteBaselayer();
      }
    }, this);
    this.add_related_model(this._menuItems);

    this._menuView.model.bind('change:visible', function (model, isContextMenuVisible) {
      if (this._hasContextMenu() && !isContextMenuVisible) {
        this._hideContextMenu();
      }
    }, this);

    this._menuView.show();
    this.addView(this._menuView);
  },

  _deleteBaselayer: function () {
    this._basemapsCollection.remove(this.model);
  },

  _onToggleContextMenuClicked: function (e) {
    this.killEvent(e);

    if (this._hasContextMenu()) {
      this._hideContextMenu();
    } else {
      this._showContextMenu({
        x: e.pageX + 215, // CustomList--small width
        y: e.pageY
      });
    }
  }

});
