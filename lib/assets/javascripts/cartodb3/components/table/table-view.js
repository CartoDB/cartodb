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

    this.rowsCollection = opts.rowsCollection;
    this.modals = opts.modals;
    this.columnsCollection = opts.columnsCollection;
    this._querySchemaModel = opts.querySchemaModel;

    this.tableViewModel = new TableViewModel({
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
    this.add_related_model(this._querySchemaModel);
  },

  _fetchRowsData: function () {
    if (this._querySchemaModel.get('status') === 'fetched') {
      this.rowsCollection.fetch({
        data: {
          page: this.tableViewModel.get('page'),
          order_by: this.tableViewModel.get('order_by'),
          exclude: !this.tableViewModel.isCustomQueryApplied() ? ['the_geom_webmercator'] : []
        }
      });
    }
  },

  _initViews: function () {
    var tableHeadView = new TableHeadView({
      modals: this.modals,
      querySchemaModel: this._querySchemaModel,
      columnsCollection: this.columnsCollection,
      tableViewModel: this.tableViewModel
    });

    this.addView(tableHeadView);
    this.$el.append(tableHeadView.render().el);

    var tableBodyView = new TableBodyView({
      modals: this.modals,
      columnsCollection: this.columnsCollection,
      rowsCollection: this.rowsCollection,
      querySchemaModel: this._querySchemaModel,
      tableViewModel: this.tableViewModel
    });

    this.addView(tableBodyView);
    this.$el.append(tableBodyView.render().el);
  },

  addRow: function () {
    addTableRow({
      tableViewModel: this.tableViewModel,
      rowsCollection: this.rowsCollection
    });
  },

  addColumn: function () {
    addTableColumn({
      tableViewModel: this.tableViewModel,
      columnsCollection: this.columnsCollection
    });
  },

  _onQueryChanged: function () {
    this.tableViewModel.resetFetchDefaults();
  }

});
