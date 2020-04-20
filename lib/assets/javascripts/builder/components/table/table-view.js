var CoreView = require('backbone/core-view');
var _ = require('underscore');
var $ = require('jquery');
var TableViewModel = require('./table-view-model.js');
var TableHeadView = require('./head/table-head-view');
var TableBodyView = require('./body/table-body-view');
var addTableRow = require('./operations/table-add-row');
var addTableColumn = require('./operations/table-add-column');
var SQLUtils = require('builder/helpers/sql-utils');
var checkAndBuildOpts = require('builder/helpers/required-opts');
const { nodeHasTradeArea, nodeHasSQLFunction } = require('builder/helpers/analysis-node-utils');

var REQUIRED_OPTS = [
  'analysisDefinitionNodeModel',
  'columnsCollection',
  'modals'
];

/*
 *  Main table view
 */

module.exports = CoreView.extend({

  className: 'Table-wrapper',
  tagName: 'div',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._rowsCollection = this._analysisDefinitionNodeModel.queryRowsCollection;
    this._queryGeometryModel = this._analysisDefinitionNodeModel.queryGeometryModel;
    this._querySchemaModel = this._analysisDefinitionNodeModel.querySchemaModel;
    this._tableModel = this._analysisDefinitionNodeModel.isSourceType() && this._analysisDefinitionNodeModel.getTableModel();

    this._tableViewModel = new TableViewModel({
      relativePositionated: opts.relativePositionated,
      tableName: opts.tableName
    }, {
      analysisDefinitionNodeModel: this._analysisDefinitionNodeModel,
      columnsCollection: this._columnsCollection
    });

    this._initBinds();

    if (this._querySchemaModel.shouldFetch()) {
      this._querySchemaModel.fetch();
    } else if (this._rowsCollection.shouldFetch()) {
      this._fetchRowsData();
    }
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    var tableElement = $('<div>').addClass('Table js-table');
    this.$el.append(tableElement);
    this._initViews();

    this.$('.js-table').toggleClass('Table--relative', !!this._tableViewModel.get('relativePositionated'));
    this._setDisableState();
    return this;
  },

  _initBinds: function () {
    this._onChangeQueryOrStatus = this._onChangeQueryOrStatus.bind(this);

    this.listenTo(this._querySchemaModel, 'change:query change:status', _.debounce(this._onChangeQueryOrStatus, 100));
    this.listenTo(this._querySchemaModel, 'change:status', this._setDisableState);
    this.listenTo(this._querySchemaModel, 'change:query', this._onQueryChanged);

    this._fetchRowsData = _.debounce(this._fetchRowsData, 100);
    this.listenTo(this._querySchemaModel, 'change:status', this._fetchRowsData);
    this.listenTo(this._tableViewModel, 'change:sort_order change:order_by', this._fetchRowsData);

    if (this._tableModel && this._tableModel.isSync()) {
      var syncModel = this._tableModel.getSyncModel();
      this.listenTo(syncModel, 'destroy', this.render);
    }
  },

  _setDisableState: function () {
    this.$('.js-table').toggleClass('is-disabled', !!this._tableViewModel.isDisabled());
  },

  _fetchRowsData: function (model) {
    var attrsChanged = model && _.keys(model.changed);
    var altersData = SQLUtils.altersData(this._querySchemaModel.get('query'));
    var isCustomQueryApplied = this._tableViewModel.isCustomQueryApplied();
    var changeComeFromSortOrOrder = false;

    if (attrsChanged && (_.contains(attrsChanged, 'sort_order') || _.contains(attrsChanged, 'order_by'))) {
      changeComeFromSortOrOrder = true;
    }

    if (this._querySchemaModel.isFetched() && !altersData) {
      this._rowsCollection.fetch({
        data: {
          page: this._tableViewModel.get('page'),
          order_by: !isCustomQueryApplied || changeComeFromSortOrOrder ? this._tableViewModel.get('order_by') : '',
          sort_order: !isCustomQueryApplied || changeComeFromSortOrOrder ? this._tableViewModel.get('sort_order') : '',
          exclude: !isCustomQueryApplied || changeComeFromSortOrOrder ? ['the_geom_webmercator'] : []
        }
      });
    }
  },

  _initViews: function () {
    const canHideColumns = nodeHasTradeArea(this._analysisDefinitionNodeModel) &&
      !nodeHasSQLFunction(this._analysisDefinitionNodeModel);

    var tableHeadView = new TableHeadView({
      modals: this._modals,
      queryGeometryModel: this._queryGeometryModel,
      columnsCollection: this._columnsCollection,
      tableViewModel: this._tableViewModel,
      canHideColumns
    });

    this.addView(tableHeadView);
    this.$('.js-table').append(tableHeadView.render().el);

    var tableBodyView = new TableBodyView({
      modals: this._modals,
      columnsCollection: this._columnsCollection,
      rowsCollection: this._rowsCollection,
      queryGeometryModel: this._queryGeometryModel,
      querySchemaModel: this._querySchemaModel,
      canHideColumns,
      tableViewModel: this._tableViewModel
    });

    this.addView(tableBodyView);
    this.$('.js-table').append(tableBodyView.render().el);
  },

  _onChangeQueryOrStatus: function () {
    var schemaStatus = this._querySchemaModel.get('status');
    var geometryStatus = this._queryGeometryModel.get('status');

    if (schemaStatus === 'unfetched' && this._querySchemaModel.canFetch()) {
      this._querySchemaModel.fetch();
    }

    if (geometryStatus === 'unfetched' && this._queryGeometryModel.canFetch()) {
      this._queryGeometryModel.fetch();
    }
  },

  addRow: function () {
    addTableRow({
      rowsCollection: this._rowsCollection
    });
  },

  addColumn: function () {
    addTableColumn({
      columnsCollection: this._columnsCollection
    });
  },

  getColumnsCollection: function () {
    return this._columnsCollection;
  },

  _onQueryChanged: function () {
    this._tableViewModel.resetFetchDefaults();
  },

  // Remove elements that are not applied in the view
  remove: function () {
    $('.Table-paginator').remove();
    CoreView.prototype.remove.apply(this);
  }
});
