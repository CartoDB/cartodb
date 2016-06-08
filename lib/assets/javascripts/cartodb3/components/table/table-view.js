var CoreView = require('backbone/core-view');
var TableViewModel = require('./table-view-model.js');
var TableHeadView = require('./head/table-head-view');
var TableBodyView = require('./body/table-body-view');
var QueryColumnsCollection = require('../../data/query-columns-collection');
var QueryRowsCollection = require('../../data/query-rows-collection');

/*
 *  Main table view
 */

module.exports = CoreView.extend({

  options: {
    readonly: false
  },

  className: 'Table',
  tagName: 'table',

  events: {
    'click .js-addColumn': 'addColumn'
  },

  initialize: function (opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.columnsCollection) throw new Error('columnsCollection is required');
    if (!opts.rowsCollection) throw new Error('rowsCollection is required');

    this.rowsCollection = opts.rowsCollection;
    this.columnsCollection = opts.columnsCollection;
    this._querySchemaModel = opts.querySchemaModel;

    this.tableViewModel = new TableViewModel({
      readonly: opts.readonly,
      tableName: opts.tableName
    }, {
      querySchemaModel: this._querySchemaModel
    });

    if (this._querySchemaModel.get('status') === 'unfetched') {
      this._querySchemaModel.fetch();
    }

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._querySchemaModel.bind('change:status', this._onQuerySchemaChanged, this);
    this.add_related_model(this._querySchemaModel);
  },

  _initViews: function () {
    var tableHeadView = new TableHeadView({
      querySchemaModel: this._querySchemaModel,
      columnsCollection: this.columnsCollection,
      tableViewModel: this.tableViewModel
    });

    this.addView(tableHeadView);
    this.$el.append(tableHeadView.render().el);

    var tableBodyView = new TableBodyView({
      columnsCollection: this.columnsCollection,
      rowsCollection: this.rowsCollection,
      querySchemaModel: this._querySchemaModel,
      tableViewModel: this.tableViewModel
    });

    this.addView(tableBodyView);
    this.$el.append(tableBodyView.render().el);

    var button = document.createElement('button');
    button.setAttribute('class', 'js-addColumn');
    button.innerHTML = 'New column';
    this.$el.prepend(button);
  },

  addColumn: function () {
    if (!this.tableViewModel.isDisabled()) {
      // TODO: Start loading notification

      this.columnsCollection.addColumn({
        success: function () {
          // TODO: Show ok notification
        },
        error: function () {
          // TODO: Show error notification
        }
      });
    } else {
      console.log('Not possible to add a new column without a table_name reference');
    }
  },

  _onQuerySchemaChanged: function () {
    this.tableViewModel.resetPage();
  }

});
