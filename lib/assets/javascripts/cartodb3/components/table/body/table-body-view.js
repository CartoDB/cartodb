var CoreView = require('backbone/core-view');
var $ = require('jquery');
var _ = require('underscore');
var Clipboard = require('clipboard');
var TableBodyRowView = require('./table-body-row-view');
var ContextMenuView = require('../../context-menu/context-menu-view');
var CustomListCollection = require('../../custom-list/custom-list-collection');
var addTableRow = require('../operations/table-add-row');
var RemoveRowView = require('./remove-table-row-view');
var TablePaginatorView = require('../paginator/table-paginator-view');
var tableBodyTemplate = require('./table-body.tpl');
var queryStateTemplate = require('./query-state.tpl');
var tableNoRowsTemplate = require('./table-no-rows.tpl');

/*
 *  Table body view
 */

module.exports = CoreView.extend({

  className: 'Table-body',
  tagName: 'div',

  events: {
    'click .js-options': '_showContextMenu'
  },

  initialize: function (opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.rowsCollection) throw new Error('rowsCollection is required');
    if (!opts.columnsCollection) throw new Error('columnsCollection is required');
    if (!opts.tableViewModel) throw new Error('tableViewModel');
    if (!opts.modals) throw new Error('modals is required');

    this._modals = opts.modals;

    this._tableViewModel = opts.tableViewModel;
    this._querySchemaModel = opts.querySchemaModel;

    this._columnsCollection = opts.columnsCollection;
    this._rowsCollection = opts.rowsCollection;

    this._hideContextMenu = this._hideContextMenu.bind(this);

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this._destroyScrollBinding();
    this.$el.empty();

    if (this._querySchemaModel.get('status') !== 'fetched') {
      this._renderQueryState();
    } else {
      if (!this._rowsCollection.size()) {
        this._renderNoRows();
      } else {
        this.$el.html(tableBodyTemplate());
        this._rowsCollection.each(this._renderBodyRow, this);
      }
      this._initPaginator();
    }

    return this;
  },

  _initBinds: function () {
    this._querySchemaModel.bind('change:status', this.render, this);
    this._rowsCollection.bind('reset', _.debounce(this.render.bind(this), 20), this);
    this._rowsCollection.bind('add', this._renderBodyRow, this);
    this._rowsCollection.bind('remove', this._onRemoveRow, this);
    this.add_related_model(this._querySchemaModel);
    this.add_related_model(this._rowsCollection);
  },

  _renderQueryState: function () {
    this.$el.append(
      queryStateTemplate()
    );
  },

  _renderNoRows: function () {
    this.$el.append(
      tableNoRowsTemplate()
    );
  },

  _initPaginator: function () {
    var paginatorView = new TablePaginatorView({
      rowsCollection: this._rowsCollection,
      tableViewModel: this._tableViewModel
    });
    this.$el.append(paginatorView.render().el);
    this.addView(paginatorView);
  },

  _initScrollBinding: function () {
    $('.Table').scroll(this._hideContextMenu);
    this.$('.js-tbody').scroll(this._hideContextMenu);
  },

  _destroyScrollBinding: function () {
    $('.Table').off('scroll', this._hideContextMenu);
    this.$('.js-tbody').off('scroll', this._hideContextMenu);
  },

  _renderBodyRow: function (mdl) {
    var view = new TableBodyRowView({
      model: mdl,
      columnsCollection: this._columnsCollection,
      querySchemaModel: this._querySchemaModel,
      tableViewModel: this._tableViewModel
    });
    this.addView(view);
    this.$('.js-tbody').append(view.render().el);
  },

  _onRemoveRow: function () {
    /*
    TODO: if there is no rows after a remove
      1.Back to previous page.
      2. If there is no previous page, reload.
    */
  },

  _hasContextMenu: function () {
    return this._menuView;
  },

  _hideContextMenu: function () {
    this._unhighlightCell();
    this._destroyScrollBinding();
    this._menuView.remove();
    this.removeView(this._menuView);
    delete this._menuView;
  },

  _highlightCell: function ($tableCellItem, $tableRow) {
    $tableCellItem.addClass('is-highlighted');
    $tableRow.addClass('is-highlighted');
  },

  _unhighlightCell: function () {
    this.$('.Table-cellItem.is-highlighted, .Table-row.is-highlighted').removeClass('is-highlighted');
  },

  _showContextMenu: function (ev) {
    var self = this;
    var position = { x: ev.clientX, y: ev.clientY };
    var $tableRow = $(ev.target).closest('.Table-row');
    var $tableCellItem = $(ev.target).closest('.Table-cellItem');
    var modelCID = $tableRow.data('model');

    this._highlightCell($tableCellItem, $tableRow);

    var menuItems = [{
      label: _t('components.table.rows.options.copy'),
      val: 'copy',
      action: function () {
        // Work-around for Clipboard \o/
        this._clipboard = new Clipboard($tableCellItem.get(0));
        $tableCellItem.click();
        this._clipboard.destroy();
      }
    }];

    if (!this._tableViewModel.isDisabled()) {
      menuItems = [
        {
          label: _t('components.table.rows.options.edit'),
          val: 'edit',
          action: function () {

          }
        }, {
          label: _t('components.table.rows.options.create'),
          val: 'create',
          action: function () {
            addTableRow({
              tableViewModel: self._tableViewModel,
              _rowsCollection: self._rowsCollection,
              onSuccess: function () {
                self._scrollToBottom();
              }
            });
          }
        }
      ].concat(menuItems);

      menuItems.push({
        label: _t('components.table.rows.options.delete'),
        val: 'delete',
        destructive: true,
        action: function () {
          var rowModel = self._rowsCollection.get({ cid: modelCID });

          self._modals.create(
            function (modalModel) {
              return new RemoveRowView({
                modalModel: modalModel,
                tableViewModel: self._tableViewModel,
                rowModel: rowModel
              });
            }
          );
        }
      });
    }

    var collection = new CustomListCollection(menuItems);

    var menuViewClasses = 'Table-rowMenu ';
    if ($tableRow.index() > 36) {
      menuViewClasses += 'Table-rowMenu--bottom ';
    }

    this._menuView = new ContextMenuView({
      className: menuViewClasses + ContextMenuView.prototype.className,
      collection: collection,
      triggerElementID: modelCID,
      position: position
    });

    collection.bind('change:selected', function (menuItem) {
      var action = menuItem.get('action');
      action && action();
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

  _scrollToBottom: function () {
    var tbodyHeight = this.$('.js-tbody').outerHeight();
    this.$('.js-tbody').animate({
      scrollTop: tbodyHeight
    }, 'slow');
  },

  clean: function () {
    this._destroyScrollBinding();
    CoreView.prototype.clean.apply(this);
  }

});
