var ContextMenuView = require('../components/context-menu/context-menu-view');
var CustomListCollection = require('../components/custom-list/custom-list-collection');

module.exports = {
  _initContextMenu: function (items) {
    this._menuItems = new CustomListCollection(items);
    this._menuItems.on('change:selected', this._onContextMenuSelect, this); // to be implemented in the view
    this.add_related_model(this._menuItems);
  },

  _onContextMenuSelect: function (menuItem) {
    var action = menuItem.get('action');
    action && action.call(this);
  },

  _showContextMenu: function (position) {
    var triggerElementID = 'context-menu-trigger-' + this.cid;
    var menuItems = this._menuItems;
    this._resetContextMenuItems();
    this.$('.js-toggle-menu').attr('id', triggerElementID);
    this._menuView = new ContextMenuView({
      collection: menuItems,
      triggerElementID: triggerElementID,
      position: position
    });

    this._menuView.model.on('change:visible', function (model, isContextMenuVisible) {
      if (this._hasContextMenu() && !isContextMenuVisible) {
        this._hideContextMenu();
      }
    }, this);

    this._menuView.show();
    this.addView(this._menuView);
  },

  _resetContextMenuItems: function () {
    var selected = this._menuItems.getSelectedItem();
    selected && selected.set({selected: false}, {silent: true});
  },

  _hasContextMenu: function () {
    return this._menuView != null;
  },

  _hideContextMenu: function () {
    this._menuView.remove();
    this.removeView(this._menuView);
    delete this._menuView;
  },

  _onToggleContextMenuClicked: function (event) {
    event.preventDefault();
    if (this._hasContextMenu()) {
      this._hideContextMenu();
    } else {
      this._showContextMenu({
        x: event.pageX,
        y: event.pageY
      });
    }
  }
};
