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
    if (!opts.analysisDefinitionNodeModel) throw new Error('analysisDefinitionNodeModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._analysisDefinitionNodeModel = opts.analysisDefinitionNodeModel;
    this._querySchemaModel = this._analysisDefinitionNodeModel.querySchemaModel;
    this._configModel = opts.configModel;

    this.columnsCollection = new QueryColumnsCollection(
      this._querySchemaModel.columnsCollection.toJSON(),
      {
        configModel: this._configModel,
        analysisDefinitionNodeModel: this._analysisDefinitionNodeModel,
        querySchemaModel: this._querySchemaModel
      }
    );

    this.rowsCollection = new QueryRowsCollection(
      this._querySchemaModel.rowsSampleCollection.toJSON(),
      {
        configModel: this._configModel,
        querySchemaModel: this._querySchemaModel
      }
    );

    this.tableViewModel = new TableViewModel();

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
      configModel: this._configModel
    });

    this.addView(tableHeadView);
    this.$el.append(tableHeadView.render().el);

    var tableBodyView = new TableBodyView({
      columnsCollection: this.columnsCollection,
      rowsCollection: this.rowsCollection,
      querySchemaModel: this._querySchemaModel,
      tableViewModel: this.tableViewModel,
      configModel: this._configModel
    });

    this.addView(tableBodyView);
    this.$el.append(tableBodyView.render().el);

    var button = document.createElement('button');
    button.setAttribute('class', 'js-addColumn');
    button.innerHTML = 'New column';
    this.$el.prepend(button);
  },

  addColumn: function () {
    if (!this.options.readonly && this._analysisDefinitionNodeModel.get('table_name')) {
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
    this.tableViewModel.setDefaults();
  }

});
