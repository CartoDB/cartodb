var $ = require('jquery');
var CoreView = require('backbone/core-view');
var template = require('./table-head-item.tpl');
var ContextMenuView = require('builder/components/context-menu/context-menu-view');
var CustomListCollection = require('builder/components/custom-list/custom-list-collection');
var TableHeadOptionsItemView = require('./table-head-options-item-view');
var tableHeadOptionsItemTemplate = require('./table-head-options-item.tpl');
var ConfirmationModalView = require('builder/components/modals/confirmation/modal-confirmation-view');
var QueryColumnModel = require('builder/data/query-column-model');
var addColumnOperation = require('builder/components/table/operations/table-add-column');
var renameColumnOperation = require('builder/components/table/operations/table-rename-column');
var changeColumnTypeOperation = require('builder/components/table/operations/table-change-column-type');
var removeTableColumnOperation = require('builder/components/table/operations/table-remove-column');

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
    'click .js-columnOptions': '_showContextMenu'
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
    this._menuView.collection.unbind(null, null, this);
    this.removeView(this._menuView);
    this._menuView.clean();
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
      action: function (model) {
        self._tableViewModel.set({
          sort_order: model.get('sort'),
          order_by: columnName
        });
      }
    }];

    if (!this._tableViewModel.isDisabled()) {
      if (!this.model.isCartoDBIDColumn() && !this.model.isGeometryColumn()) {
        menuItems = menuItems.concat([
          {
            label: _t('components.table.columns.options.rename'),
            val: 'rename',
            action: function () {
              self._startEditing();
            }
          }, {
            label: _t('components.table.columns.options.change'),
            type: this.model.get('type'),
            isLastColumns: (this._columnsCollection.size() - elementIndex) < 3,
            val: 'change',
            action: function (model) {
              self._changeColumnType(model.get('type'));
            }
          }
        ]);
      }

      menuItems.push({
        label: _t('components.table.columns.options.create'),
        val: 'create',
        action: function () {
          self._addColumn();
        }
      });

      if (!this.model.isCartoDBIDColumn() && !this.model.isGeometryColumn()) {
        menuItems.push(
          {
            label: _t('components.table.columns.options.delete'),
            val: 'delete',
            destructive: true,
            action: function () {
              self._removeColumn();
            }
          }
        );
      }
    }

    var collection = new CustomListCollection(menuItems);

    this._menuView = new ContextMenuView({
      className: ContextMenuView.prototype.className + ' Table-columnMenu',
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

  _addColumn: function () {
    addColumnOperation({
      columnsCollection: this._columnsCollection
    });
  },

  _changeColumnType: function (newType) {
    var self = this;
    var oldType = this.model.get('type');
    var isTypeChangeDestructive = QueryColumnModel.isTypeChangeDestructive(oldType, newType);
    if (!isTypeChangeDestructive) {
      changeColumnTypeOperation({
        columnModel: this.model,
        newType: newType
      });
    } else {
      this._modals.create(
        function (modalModel) {
          return new ConfirmationModalView({
            modalModel: modalModel,
            template: require('./modals-templates/change-table-column-type.tpl'),
            renderOpts: {
              columnName: self.model.get('name'),
              newType: newType
            },
            loadingTitle: _t('components.table.columns.change-type.loading', {
              columnName: self.model.get('name')
            }),
            runAction: function () {
              changeColumnTypeOperation({
                columnModel: self.model,
                newType: newType,
                onSuccess: function () {
                  modalModel.destroy();
                },
                onError: function (e) {
                  modalModel.destroy();
                }
              });
            }
          });
        }
      );
    }
  },

  _removeColumn: function () {
    var self = this;
    this._modals.create(
      function (modalModel) {
        return new ConfirmationModalView({
          modalModel: modalModel,
          template: require('./modals-templates/remove-table-column.tpl'),
          renderOpts: {
            name: self.model.get('name')
          },
          loadingTitle: _t('components.table.columns.destroy.loading', {
            columnName: self.model.get('name')
          }),
          runAction: function () {
            removeTableColumnOperation({
              columnModel: self.model,
              onSuccess: function () {
                modalModel.destroy();
              },
              onError: function (e) {
                modalModel.destroy();
              }
            });
          }
        });
      }
    );
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
    var keyCode = ev.which;
    if (keyCode === ENTER_KEY_CODE) {
      this._saveNewName();
    } else if (keyCode === ESC_KEY_CODE) {
      this._finishEditing();
    }
  },

  _startEditing: function () {
    this.$('.js-attribute')
      .addClass('is-active')
      .removeAttr('readonly');

    this._initRenameBinds();
  },

  _finishEditing: function () {
    this.$('.js-attribute')
      .val(this.model.get('name'))
      .removeClass('is-active')
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
            return new ConfirmationModalView({
              modalModel: modalModel,
              template: require('./modals-templates/rename-table-column.tpl'),
              renderOpts: {
                columnName: oldName,
                newName: newName
              },
              loadingTitle: _t('components.table.columns.rename.loading', {
                columnName: oldName,
                newName: newName
              }),
              runAction: function () {
                renameColumnOperation({
                  columnModel: columnModel,
                  newName: newName,
                  onSuccess: function () {
                    modalModel.destroy();
                  },
                  onError: function (e) {
                    modalModel.destroy();
                  }
                });
              }
            });
          }
        );
      }
    }

    // Setting old name just in case user cancel it
    this._finishEditing();
  },

  focusInput: function () {
    this._startEditing();
    this.$('.js-attribute').select();
  },

  clean: function () {
    this._destroyRenameBinds();
    this._destroyScrollBinding();
    CoreView.prototype.clean.apply(this);
  }
});
