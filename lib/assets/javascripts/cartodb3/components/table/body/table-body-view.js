var CoreView = require('backbone/core-view');
var $ = require('jquery');
var _ = require('underscore');
var Clipboard = require('clipboard');
var TableBodyRowView = require('./table-body-row-view');
var ContextMenuView = require('../../context-menu/context-menu-view');
var CustomListCollection = require('../../custom-list/custom-list-collection');
var addTableRow = require('../operations/table-add-row');
var removeTableRow = require('../operations/table-remove-row');
var template = require('./table-body.tpl');

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

    this._tableViewModel = opts.tableViewModel;
    this._querySchemaModel = opts.querySchemaModel;

    this.columnsCollection = opts.columnsCollection;
    this.rowsCollection = opts.rowsCollection;

    this._hideContextMenu = this._hideContextMenu.bind(this);

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this.rowsCollection.each(this._renderBodyRow, this);
    return this;
  },

  _initBinds: function () {
    this.rowsCollection.bind('reset', _.debounce(this.render.bind(this), 20), this);
    this.rowsCollection.bind('add', _.debounce(this._renderBodyRow.bind(this), 20), this);
    this._tableViewModel.bind('change:page', this._onTablePageChange, this);
    this.add_related_model(this.rowsCollection);
    this.add_related_model(this._tableViewModel);
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
      columnsCollection: this.columnsCollection,
      querySchemaModel: this._querySchemaModel,
      tableViewModel: this._tableViewModel
    });
    this.addView(view);
    this.$('.js-tbody').append(view.render().el);
  },

  _onTablePageChange: function () {
    this.rowsCollection.fetch({
      data: _.extend(
        this._tableViewModel.pick('page', 'order_by', 'sort_order'),
        {
          exclude: this._tableViewModel.isCustomQueryApplied() ? ['the_geom_webmercator'] : []
        }
      )
    });
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
              rowsCollection: self.rowsCollection,
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
          var rowModel = self.rowsCollection.get({ cid: modelCID });
          rowModel && removeTableRow({
            tableViewModel: self._tableViewModel,
            rowModel: rowModel
          });
        }
      });
    }

    var collection = new CustomListCollection(menuItems);

    this._menuView = new ContextMenuView({
      className: 'Table-rowMenu ' + ContextMenuView.prototype.className,
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
