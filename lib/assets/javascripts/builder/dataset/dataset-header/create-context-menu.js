var _ = require('underscore');
var ContextMenuView = require('builder/components/context-menu/context-menu-view');
var CustomListCollection = require('builder/components/custom-list/custom-list-collection');
var REQUIRED_OPTS = [
  'ev',
  'isTableOwner',
  'isSync',
  'isCustomQuery',
  'triggerElementID'
];

module.exports = function (opts) {
  var data = {};
  _.each(REQUIRED_OPTS, function (item) {
    if (opts[item] === undefined) throw new Error(item + ' is required');
    data['_' + item] = opts[item];
  });

  var position = { x: data._ev.clientX, y: data._ev.clientY };
  var menuItems = [
    {
      label: _t('dataset.duplicate.' + (data._isCustomQuery ? 'customOption' : 'option')),
      val: 'duplicate',
      action: function () {
        this.trigger('duplicate');
      }
    }
  ];

  if (data._isTableOwner) {
    if (!data._isSync) {
      menuItems.push({
        label: _t('dataset.rename.option'),
        val: 'rename',
        action: function () {
          this.trigger('rename');
        }
      });
    }

    menuItems = menuItems.concat([
      {
        label: _t('dataset.metadata.option'),
        val: 'metadata',
        action: function () {
          this.trigger('metadata');
        }
      }, {
        label: _t('dataset.lock.option'),
        val: 'lock',
        action: function () {
          this.trigger('lock');
        }
      }, {
        label: _t('dataset.delete.option'),
        val: 'delete',
        destructive: true,
        action: function () {
          this.trigger('delete');
        }
      }
    ]);
  }

  var collection = new CustomListCollection(menuItems);

  var view = new ContextMenuView({
    collection: collection,
    triggerElementID: data._triggerElementID,
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
