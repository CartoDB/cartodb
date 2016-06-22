var CoreView = require('backbone/core-view');
var TableViewModel = require('./table-view-model.js');
var TableHeadView = require('./head/table-head-view');
var TableBodyView = require('./body/table-body-view');
var addTableRow = require('./operations/table-add-row');
var addTableColumn = require('./operations/table-add-column');

/*
 *  Main table view
 */

module.exports = CoreView.extend({

  options: {
    readonly: false
  },

  className: 'Table',
  tagName: 'div',

  initialize: function (opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.columnsCollection) throw new Error('columnsCollection is required');
    if (!opts.rowsCollection) throw new Error('rowsCollection is required');
    if (!opts.modals) throw new Error('modals is required');

    this._rowsCollection = opts.rowsCollection;
    this._modals = opts.modals;
    this._columnsCollection = opts.columnsCollection;
    this._querySchemaModel = opts.querySchemaModel;

    this._tableViewModel = new TableViewModel({
      readonly: opts.readonly,
      tableName: opts.tableName
    }, {
      querySchemaModel: this._querySchemaModel
    });

    this._initBinds();

    var querySchemaStatus = this._querySchemaModel.get('status');
    if (querySchemaStatus === 'unfetched') {
      this._querySchemaModel.fetch();
    } else if (querySchemaStatus === 'fetched') {
      this._fetchRowsData();
    }
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._querySchemaModel.bind('change:query', this._onQueryChanged, this);
    this._querySchemaModel.bind('change:status', this._fetchRowsData, this);
    this._tableViewModel.bind('change:sort_order change:order_by', this._fetchRowsData, this);
    this.add_related_model(this._querySchemaModel);
  },

  _fetchRowsData: function () {
    if (this._querySchemaModel.get('status') === 'fetched') {
      this._rowsCollection.fetch({
        data: {
          page: this._tableViewModel.get('page'),
          order_by: this._tableViewModel.get('order_by'),
          sort_order: this._tableViewModel.get('sort_order'),
          exclude: !this._tableViewModel.isCustomQueryApplied() ? ['the_geom_webmercator'] : []
        }
      });
    }
  },

  _initViews: function () {
    var tableHeadView = new TableHeadView({
      modals: this._modals,
      querySchemaModel: this._querySchemaModel,
      columnsCollection: this._columnsCollection,
      tableViewModel: this._tableViewModel
    });

    this.addView(tableHeadView);
    this.$el.append(tableHeadView.render().el);

    var tableBodyView = new TableBodyView({
      modals: this._modals,
      columnsCollection: this._columnsCollection,
      rowsCollection: this._rowsCollection,
      querySchemaModel: this._querySchemaModel,
      tableViewModel: this._tableViewModel
    });

    this.addView(tableBodyView);
    this.$el.append(tableBodyView.render().el);
  },

  addRow: function () {
    addTableRow({
      tableViewModel: this._tableViewModel,
      rowsCollection: this._rowsCollection
    });
  },

  addColumn: function () {
    addTableColumn({
      tableViewModel: this._tableViewModel,
      columnsCollection: this._columnsCollection
    });
  },

  _onQueryChanged: function () {
    this._tableViewModel.resetFetchDefaults();
  }

});
