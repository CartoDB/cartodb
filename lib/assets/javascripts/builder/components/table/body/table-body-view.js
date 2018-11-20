var CoreView = require('backbone/core-view');
var $ = require('jquery');
var _ = require('underscore');
var Clipboard = require('clipboard');
var TableBodyRowView = require('./table-body-row-view');
var ContextMenuView = require('builder/components/context-menu/context-menu-view');
var CustomListCollection = require('builder/components/custom-list/custom-list-collection');
var addTableRowOperation = require('builder/components/table/operations/table-add-row');
var removeTableRowOperation = require('builder/components/table/operations/table-remove-row');
var editCellOperation = require('builder/components/table/operations/table-edit-cell');
var ConfirmationModalView = require('builder/components/modals/confirmation/modal-confirmation-view');
var TablePaginatorView = require('builder/components/table/paginator/table-paginator-view');
var tableBodyTemplate = require('./table-body.tpl');
var renderLoading = require('builder/components/loading/render-loading');
var ErrorView = require('builder/components/error/error-view');
var tableNoRowsTemplate = require('./table-no-rows.tpl');
var EditorsServiceModel = require('builder/components/table/editors/editors-service-model');
var EditorsModel = require('builder/components/table/editors/types/editor-model');
var errorParser = require('builder/helpers/error-parser');
var magicPositioner = require('builder/helpers/magic-positioner');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var EDITORS_MAP = {
  'string': require('builder/components/table/editors/types/editor-string-view'),
  'number': require('builder/components/table/editors/types/editor-base-view'),
  'boolean': require('builder/components/table/editors/types/editor-boolean-view'),
  'date': require('builder/components/table/editors/types/editor-date-view'),
  'default': require('builder/components/table/editors/types/editor-string-view')
};

var REQUIRED_OPTS = [
  'columnsCollection',
  'modals',
  'queryGeometryModel',
  'querySchemaModel',
  'rowsCollection',
  'canHideColumns',
  'tableViewModel'
];

/*
 *  Table body view
 */

module.exports = CoreView.extend({

  className: 'Table-body',
  tagName: 'div',

  events: {
    'click': '_onClick',
    'dblclick': '_onDblClick'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._editors = new EditorsServiceModel();

    this._closeEditor = this._closeEditor.bind(this);
    this._hideContextMenu = this._hideContextMenu.bind(this);

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this._destroyScrollBinding();
    this.$el.empty();

    // Render results when we have the schema and goemetry is not being fetched
    if (this._querySchemaModel.isFetched() && !this._queryGeometryModel.isFetching() && !this._rowsCollection.isFetching()) {
      if (!this._rowsCollection.size()) {
        this._renderNoRows();
      } else {
        this.$el.html(tableBodyTemplate());
        this._rowsCollection.each(this._renderBodyRow, this);
        this._initPaginator();
      }
    } else {
      this._renderQueryState();
    }

    this.$el.toggleClass('Table-body--relative', !!this._tableViewModel.get('relativePositionated'));

    return this;
  },

  _initBinds: function () {
    this._queryGeometryModel.bind('change:status', this.render, this);
    this._querySchemaModel.bind('change:status', this.render, this);
    this._rowsCollection.bind('reset', _.debounce(this.render.bind(this), 20), this);
    this._rowsCollection.bind('add', function (model) {
      if (this._rowsCollection.size() === 1) {
        this.render();
      } else {
        this._renderBodyRow(model);
      }
    }, this);
    this._rowsCollection.bind('remove', this._onRemoveRow, this);
    this._rowsCollection.bind('fail', function (mdl, response) {
      if (!response || (response && response.statusText !== 'abort')) {
        this._renderError(errorParser(response));
      }
    }, this);
    this.add_related_model(this._queryGeometryModel);
    this.add_related_model(this._querySchemaModel);
    this.add_related_model(this._rowsCollection);
  },

  _renderQueryState: function () {
    var querySchemaStatus = this._querySchemaModel.get('status');
    var nodeReady = this._querySchemaModel.get('ready');
    var geometryStatus = this._queryGeometryModel.get('status');
    var rowsCollectionStatus = this._rowsCollection.getStatusValue();

    if (nodeReady) {
      if (querySchemaStatus === 'unavailable' && geometryStatus === 'unavailable' ||
          rowsCollectionStatus === 'unavailable') {
        this._renderError(this._querySchemaModel.get('query_errors'));
      } else {
        this._renderLoading();
      }
    } else {
      this._renderLoading();
    }
  },

  _renderLoading: function () {
    this.$el.html(
      renderLoading({
        title: _t('components.table.rows.loading.title')
      })
    );
  },

  _renderError: function (desc) {
    var view = new ErrorView({
      title: _t('components.table.rows.error.title'),
      desc: desc || _t('components.table.rows.error.desc')
    });
    this.addView(view);
    this.$el.html(view.render().el);
  },

  _renderNoRows: function () {
    this.$el.html(
      tableNoRowsTemplate({
        page: this._tableViewModel.get('page'),
        customQuery: this._tableViewModel.isCustomQueryApplied()
      })
    );
  },

  _initPaginator: function () {
    var paginatorView = new TablePaginatorView({
      rowsCollection: this._rowsCollection,
      tableViewModel: this._tableViewModel,
      scrollToBottom: this._scrollToBottom.bind(this)
    });

    // Bug in Chrome with position:fixed :(, so we have to choose body as
    // parent
    var $el = $('body');
    // But if we have chosen relativePositionated, we should add close
    // to the table view
    if (this._tableViewModel.get('relativePositionated')) {
      $el = this.$el.closest('.Table').parent();
    }

    $el.append(paginatorView.render().el);
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
      simpleGeometry: this._queryGeometryModel.get('simple_geom'),
      canHideColumns: this._canHideColumns,
      tableViewModel: this._tableViewModel
    });
    this.addView(view);
    this.$('.js-tbody').append(view.render().el);
  },

  _onRemoveRow: function () {
    if (!this._rowsCollection.size()) {
      this._rowsCollection.resetFetch();
      this._queryGeometryModel.resetFetch();

      var page = this._tableViewModel.get('page');
      if (page > 0) {
        this._tableViewModel.set('page', page - 1);
      } else {
        this.render();
      }
    }
  },

  _hasContextMenu: function () {
    return this._menuView;
  },

  _hideContextMenu: function () {
    this._unhighlightCell();
    this._destroyScrollBinding();
    this._menuView.collection.unbind(null, null, this);
    this.removeView(this._menuView);
    this._menuView.clean();
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
    var attribute = $tableCellItem.data('attribute');
    var rowModel = self._rowsCollection.get({ cid: modelCID });
    var menuItems = [];

    menuItems.push({
      label: _t('components.table.rows.options.copy'),
      val: 'copy',
      action: function () {
        self._copyValue($tableCellItem);
      }
    });

    if (!this._tableViewModel.isDisabled()) {
      menuItems = [
        {
          label: _t('components.table.rows.options.edit'),
          val: 'edit',
          action: function () {
            self._editCell(rowModel, attribute);
          }
        }, {
          label: _t('components.table.rows.options.create'),
          val: 'create',
          action: function () {
            self._addRow();
          }
        }
      ].concat(menuItems);

      menuItems.push({
        label: _t('components.table.rows.options.delete'),
        val: 'delete',
        destructive: true,
        action: function () {
          self._removeRow(rowModel);
        }
      });
    }

    // No options?, don't open anything
    if (!menuItems.length) {
      return false;
    }

    var collection = new CustomListCollection(menuItems);

    this._menuView = new ContextMenuView({
      className: 'Table-rowMenu ' + ContextMenuView.prototype.className,
      collection: collection,
      triggerElementID: modelCID,
      position: position
    });

    this._menuView.$el.css(
      magicPositioner({
        parentView: $('body'),
        posX: position.x,
        posY: position.y
      })
    );

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

    this._highlightCell($tableCellItem, $tableRow);
    this._initScrollBinding();
  },

  _onClick: function (ev) {
    var isCellOptions = $(ev.target).hasClass('js-cellOptions');
    if (isCellOptions) {
      if (this._hasContextMenu()) {
        this._hideContextMenu();
      } else {
        this._showContextMenu(ev);
      }
    }
  },

  _onDblClick: function (ev) {
    var $tableCellItem = $(ev.target).closest('.Table-cellItem');
    var isCellOptions = $(ev.target).hasClass('js-cellOptions');

    if ($tableCellItem && !isCellOptions) {
      var $tableRow = $tableCellItem.closest('.Table-row');
      var modelCID = $tableRow.data('model');
      var attribute = $tableCellItem.data('attribute');
      var rowModel = this._rowsCollection.get({ cid: modelCID });

      if (!this._tableViewModel.isDisabled() && rowModel && attribute && attribute !== 'cartodb_id') {
        this._editCell(rowModel, attribute);
      }
    }
  },

  _copyValue: function ($el) {
    // Work-around for Clipboard \o/
    this._clipboard = new Clipboard($el.get(0));
    $el.click();
    this._clipboard.destroy();
  },

  _addRow: function () {
    addTableRowOperation({
      rowsCollection: this._rowsCollection
    });
  },

  _initEditorScrollBinding: function () {
    $('.Table').scroll(this._closeEditor);
    this.$('.js-tbody').scroll(this._closeEditor);
  },

  _destroyEditorScrollBinding: function () {
    $('.Table').unbind('scroll', this._closeEditor);
    this.$('.js-tbody').unbind('scroll', this._closeEditor);
  },

  _closeEditor: function () {
    this._unhighlightCell();
    this._destroyEditorScrollBinding();
    this._editors.unbind(null, null, this);
    this._editors.destroy();
  },

  _saveValue: function (rowModel, attribute, newValue) {
    if (rowModel.get(attribute) !== newValue) {
      editCellOperation({
        rowModel: rowModel,
        attribute: attribute,
        newValue: newValue
      });
    }
  },

  _doCellEdition: function (rowModel, attribute) {
    var $tableRow = this.$('[data-model="' + rowModel.cid + '"]');
    var $tableCell = $tableRow.find('[data-attribute="' + attribute + '"]');
    var $options = $tableCell.find('.js-cellOptions');
    var columnModel = _.first(this._columnsCollection.where({ name: attribute }));
    var type = columnModel.get('type');

    this._highlightCell($tableCell, $tableRow);
    this._initEditorScrollBinding();

    var model = new EditorsModel({
      type: type,
      value: rowModel.get(attribute)
    });

    this._editors.bind('destroyedEditor', this._closeEditor, this);
    this._editors.bind('confirmedEditor', function () {
      if (model.isValid()) {
        this._saveValue(
          rowModel,
          attribute,
          model.get('value')
        );
      }
    }, this);

    var position = $options.offset();

    if ($tableCell.index() > 1) {
      position.right = window.innerWidth - position.left;
      delete position.left;
    }

    if (this._rowsCollection.size() > 4 && ($tableRow.index() + 2) >= (this._rowsCollection.size() - 1)) {
      position.bottom = window.innerHeight - position.top;
      delete position.top;
    } else {
      position.top = position.top + 20;
    }

    var View = EDITORS_MAP[type];

    if (!View) {
      View = EDITORS_MAP['default'];
    }

    this._editors.create(
      function (editorModel) {
        return new View({
          editorModel: editorModel,
          model: model
        });
      },
      position
    );
  },

  _editCell: function (rowModel, attribute) {
    var callback = this._doCellEdition.bind(this, rowModel, attribute);
    rowModel.fetchRowIfGeomIsNotLoaded(callback);
  },

  _removeRow: function (rowModel) {
    var self = this;

    this._modals.create(
      function (modalModel) {
        return new ConfirmationModalView({
          modalModel: modalModel,
          template: require('./modals-templates/remove-table-row.tpl'),
          renderOpts: {
            cartodb_id: rowModel.get('cartodb_id')
          },
          loadingTitle: _t('components.table.rows.destroy.loading', {
            cartodb_id: rowModel.get('cartodb_id')
          }),
          runAction: function () {
            removeTableRowOperation({
              tableViewModel: self._tableViewModel,
              rowModel: rowModel,
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

  _scrollToBottom: function () {
    var tbodyHeight = this.$('.js-tbody').get(0).scrollHeight;
    this.$('.js-tbody').animate({
      scrollTop: tbodyHeight
    }, 'slow');
  },

  clean: function () {
    this._destroyScrollBinding();
    CoreView.prototype.clean.apply(this);
  }

});
