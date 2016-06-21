var $ = require('jquery');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var template = require('./table-head-item.tpl');
var ContextMenuView = require('../../context-menu/context-menu-view');
var CustomListCollection = require('../../custom-list/custom-list-collection');
var TableHeadOptionsItemView = require('./table-head-options-item-view');
var tableHeadOptionsItemTemplate = require('./table-head-options-item.tpl');
var TableRemoveColumnView = require('./remove-table-column-view');
var addColumn = require('../operations/table-add-column');
var changeColumnType = require('../operations/table-change-column-type');
// var TableChangeColumnView = require('./remove-table-change-type-view');

/*
 *  Main table view
 */

module.exports = CoreView.extend({

  className: 'Table-headItem',
  tagName: 'th',

  events: {
    'dblclick .js-attribute': '_onAttributeDblClicked',
    'focusout .js-attribute': '_finishEditName',
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
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template({
        name: this.model.get('name'),
        type: this.model.get('type'),
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

    this._highlightHead();

    var menuItems = [{
      label: _t('components.table.columns.options.order'),
      val: 'order',
      action: function (mdl) {
        self._tableViewModel.set({
          sort_order: mdl.get('sort'),
          order_by: self.model.get('name')
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
                // self._modals.create(
                //   function (modalModel) {
                //     return new TableChangeColumnView({
                //       modalModel: modalModel,
                //       tableViewModel: self._tableViewModel,
                //       columnModel: self.model,
                //       newType: mdl.get('type')
                //     });
                //   }
                // );
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
                    tableViewModel: self._tableViewModel,
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
      this._startEditName();
    }
  },

  _startEditName: function () {
    this.$('.js-attribute')
      .removeClass('is-disabled')
      .removeAttr('readonly');
  },

  _finishEditName: function () {
    if (this.model.isEditable()) {
      var newValue = this.$('.js-attribute').val();
      this.$('.js-attribute')
        .addClass('is-disabled')
        .attr('readonly', '');

      this.model.save({
        new_name: newValue,
        old_name: this.model.get('name')
      }, { wait: true });
    }
  },

  clean: function () {
    this._destroyScrollBinding();
    CoreView.prototype.clean.apply(this);
  }

});
