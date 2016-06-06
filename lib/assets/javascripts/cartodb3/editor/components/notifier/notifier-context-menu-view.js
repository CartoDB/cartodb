var cdb = require('cartodb.js');
var Template = require('./notifier-close.tpl');
var ContextMenuView = require('../../components/context-menu/context-menu-view');
var CustomListCollection = require('../../components/custom-list/custom-list-collection');

module.exports = cdb.core.View.extend({
  className: 'CDB-Shape',
  events: {
    'click .js-show-menu': '_onOpenContextMenu'
  },

  initialize: function (opts) {
    if (!opts.editorModel) throw new Error('editorModel is required');
    if (!opts.menuItems) throw new Error('Context menu options are required');
    if (!opts.triggerId) throw new Error('triggerId is required');
    this._editorModel = opts.editorModel;
    this._menuItems = opts.menuItems;
    this._triggerId = opts.triggerId;
  },

  _initBinds: function () {
    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);
    this.add_related_model(this._editorModel);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.append(Template());
    return this;
  },

  _onOpenContextMenu: function () {
    this._menuView.toggle();
  },

  _renderContextMenu: function () {
    var menuItems = new CustomListCollection(this._menuItems);

    this._menuView = new ContextMenuView({
      collection: menuItems,
      triggerElementID: this._triggerId,
      offset: { top: '47px', right: '12px' }
    });

    menuItems.bind('change:selected', function (menuItem) {
      if (menuItem.get('val') === 'delete-notification') {
        this.model.destroy();
      }
    }, this);

    this.$el.append(this._menuView.render().el);
    this.addView(this._menuView);
  },

  _clickHandler: function () {
    this.trigger('notifier:close');
  },

  _changeStyle: function () {
    this.$('.js-theme').toggleClass('is-white', this._editorModel.isEditing());
  }
});
