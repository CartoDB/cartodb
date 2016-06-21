var $ = require('jquery');
var CoreView = require('backbone/core-view');
var template = require('./table-head-item.tpl');
var ContextMenuView = require('../../context-menu/context-menu-view');
var CustomListCollection = require('../../custom-list/custom-list-collection');
var TableHeadOptionsItemView = require('./table-head-options-item-view');
var tableHeadOptionsItemTemplate = require('./table-head-options-item.tpl');
var TableRemoveColumnView = require('./remove-table-column-view');
var addColumn = require('../operations/table-add-column');
var changeColumnType = require('../operations/table-change-column-type');
var TableChangeColumnView = require('./change-table-column-type-view');
var TableRenameColumnView = require('./rename-table-column-view');
var ENTER_KEY_CODE = 13;
var ESC_KEY_CODE = 27;

/*
 *  Main table view
 */

module.exports = CoreView.extend({

  className: 'Table-headItem',
  tagName: 'th',

  events: {
    'dblclick .js-attribute': '_onAttributeDblClicked',
    'focusout .js-attribute': '_saveNewName',
    'click .js-options': '_showContextMenu'
  },

  initialize: function (opts) {
    if (!opts.tableViewModel) throw new Error('tableViewModel is required');
    if (!opts.columnsCollection) throw new Error('columnsCollection is required');
    if (!opts.modals) throw new Error('modals is required');

    this._tableViewModel = opts.tableViewModel;
    this._columnsCollection = opts.columnsCollection;
    this._modals = opts.modals;

    this._hideContextMenu = this._hideContextMenu.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
  },

  render: function () {
    this.clearSubViews();
    var columnName = this.model.get('name');
    this.$el.html(
      template({
        name: columnName,
        type: this.model.get('type'),
        isOrderBy: this._tableViewModel.get('order_by') === columnName,
        sortBy: this._tableViewModel.get('sort_order'),
        geometry: this.options.simpleGeometry
      })
    );
    return this;
  },

  _hasContextMenu: function () {
    return this._menuView;
  },

  _hideContextMenu: function () {
    this._unhighlightHead();
    this._destroyScrollBinding();
    this._menuView.remove();
    this.removeView(this._menuView);
    delete this._menuView;
  },

  _highlightHead: function () {
    this.$el.addClass('is-highlighted');
  },

  _unhighlightHead: function () {
    this.$el.removeClass('is-highlighted');
  },

  _initScrollBinding: function () {
    $('.Table').scroll(this._hideContextMenu);
  },

  _destroyScrollBinding: function () {
    $('.Table').off('scroll', this._hideContextMenu);
  },

  _showContextMenu: function (ev) {
    var self = this;
    var position = { x: ev.clientX, y: ev.clientY };
    var elementIndex = this.$el.index();
    var modelCID = this.model.cid;
    var columnName = this.model.get('name');

    this._highlightHead();

    var menuItems = [{
      label: _t('components.table.columns.options.order'),
      val: 'order',
      isOrderBy: this._tableViewModel.get('order_by') === columnName,
      sortBy: this._tableViewModel.get('sort_order'),
      action: function (mdl) {
        self._tableViewModel.set({
          sort_order: mdl.get('sort'),
          order_by: columnName
        });
      }
    }];

    if (!this._tableViewModel.isDisabled()) {
      if (!this._isCartoDBColumn()) {
        menuItems = menuItems.concat([
          {
            label: _t('components.table.columns.options.rename'),
            val: 'rename',
            action: function () {
              self._startEditName();
            }
          }, {
            label: _t('components.table.columns.options.change'),
            type: this.model.get('type'),
            isLastColumns: (this._columnsCollection.size() - elementIndex) < 3,
            val: 'change',
            action: function (mdl) {
              var isTypeChangeDestructive = self.model.isTypeChangeDestructive(self.model.get('type'), mdl.get('type'));
              if (!isTypeChangeDestructive) {
                changeColumnType({
                  columnModel: self.model,
                  newType: mdl.get('type')
                });
              } else {
                self._modals.create(
                  function (modalModel) {
                    return new TableChangeColumnView({
                      modalModel: modalModel,
                      columnModel: self.model,
                      newType: mdl.get('type')
                    });
                  }
                );
              }
            }
          }
        ]);
      }

      menuItems.push({
        label: _t('components.table.columns.options.create'),
        val: 'create',
        action: function () {
          addColumn({
            tableViewModel: self._tableViewModel,
            columnsCollection: self._columnsCollection
          });
        }
      });

      if (!this._isCartoDBColumn()) {
        menuItems.push(
          {
            label: _t('components.table.columns.options.delete'),
            val: 'delete',
            destructive: true,
            action: function () {
              self._modals.create(
                function (modalModel) {
                  return new TableRemoveColumnView({
                    modalModel: modalModel,
                    columnModel: self.model
                  });
                }
              );
            }
          }
        );
      }
    }

    var collection = new CustomListCollection(menuItems);
    var menuOptionsClassName = 'Table-columnMenu ';

    // Show options to left
    if (elementIndex < 1) {
      menuOptionsClassName += 'Table-columnMenu--toLeft ';
    }

    this._menuView = new ContextMenuView({
      className: menuOptionsClassName + ContextMenuView.prototype.className,
      collection: collection,
      itemTemplate: tableHeadOptionsItemTemplate,
      itemView: TableHeadOptionsItemView,
      triggerElementID: modelCID,
      position: position
    });

    collection.bind('change:selected', function (menuItem) {
      var action = menuItem.get('action');
      action && action(menuItem);
    }, this);

    this._menuView.model.bind('change:visible', function (model, isContextMenuVisible) {
      if (this._hasContextMenu() && !isContextMenuVisible) {
        this._hideContextMenu();
      }
    }, this);

    this._menuView.show();
    this.addView(this._menuView);

    this._initScrollBinding();
  },

  _isCartoDBColumn: function () {
    return this.model.get('name') === 'cartodb_id' && this.model.get('type') === 'number';
  },

  _onAttributeDblClicked: function () {
    if (this.model.isEditable() && !this._tableViewModel.isDisabled()) {
      this._startEditing();
    }
  },

  _initRenameBinds: function () {
    $(document).bind('keydown', this._onKeyDown);
  },

  _destroyRenameBinds: function () {
    $(document).unbind('keydown', this._onKeyDown);
  },

  _onKeyDown: function (ev) {
    var keyCode = ev.keyCode;
    if (keyCode === ENTER_KEY_CODE) {
      this._saveNewName();
    } else if (keyCode === ESC_KEY_CODE) {
      this._finishEditing();
    }
  },

  _startEditing: function () {
    this.$('.js-attribute')
      .removeClass('is-disabled')
      .removeAttr('readonly');

    this._initRenameBinds();
  },

  _finishEditing: function () {
    this.$('.js-attribute')
      .val(this.model.get('name'))
      .addClass('is-disabled')
      .attr('readonly', '');

    this._destroyRenameBinds();
  },

  _saveNewName: function () {
    if (this.model.isEditable()) {
      var newName = this.$('.js-attribute').val();
      var columnModel = this.model;
      var oldName = columnModel.get('name');

      if (oldName !== newName && newName !== '') {
        this._modals.create(
          function (modalModel) {
            return new TableRenameColumnView({
              modalModel: modalModel,
              newName: newName,
              columnModel: columnModel
            });
          }
        );
      }
    }

    // Setting old name just in case user cancel it
    this._finishEditing();
  },

  clean: function () {
    this._destroyRenameBinds();
    this._destroyScrollBinding();
    CoreView.prototype.clean.apply(this);
  }

});
