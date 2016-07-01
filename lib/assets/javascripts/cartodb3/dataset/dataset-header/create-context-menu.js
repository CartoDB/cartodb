var ContextMenuView = require('../../components/context-menu/context-menu-view');
var CustomListCollection = require('../../components/custom-list/custom-list-collection');

module.exports = function (ev, isTableOwner, triggerElementID) {
  var position = { x: ev.clientX, y: ev.clientY };
  var menuItems = [
    {
      label: _t('dataset.duplicate.option'),
      val: 'duplicate',
      action: function () {
        this.trigger('duplicate', this);
      }
    }
  ];

  if (isTableOwner) {
    menuItems = menuItems.concat([
      {
        label: _t('dataset.rename.option'),
        val: 'rename',
        action: function () {
          this.trigger('rename', this);
        }
      }, {
        label: _t('dataset.lock.option'),
        val: 'lock',
        action: function () {
          this.trigger('lock', this);
        }
      }, {
        label: _t('dataset.delete.option'),
        val: 'delete',
        destructive: true,
        action: function () {
          this.trigger('delete', this);
        }
      }
    ]);
  }

  var collection = new CustomListCollection(menuItems);

  var view = new ContextMenuView({
    collection: collection,
    triggerElementID: triggerElementID,
    position: position
  });

  collection.bind('change:selected', function (menuItem) {
    var action = menuItem.get('action');
    action && action.bind(view)(menuItem);
  }, view);

  view.model.bind('change:visible', function (model, isContextMenuVisible) {
    if (view && !isContextMenuVisible) {
      collection.unbind(null, null, view);
      view.model.unbind(null, null, view);
      view.remove();
    }
  }, view);

  return view;
};
