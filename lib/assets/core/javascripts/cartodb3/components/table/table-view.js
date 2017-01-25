var CoreView = require('backbone/core-view');
var _ = require('underscore');
var $ = require('jquery');
var TableViewModel = require('./table-view-model.js');
var TableHeadView = require('./head/table-head-view');
var TableBodyView = require('./body/table-body-view');
var addTableRow = require('./operations/table-add-row');
var addTableColumn = require('./operations/table-add-column');
var SQLUtils = require('../../helpers/sql-utils');

/*
 *  Main table view
 */

module.exports = CoreView.extend({

  options: {
    readonly: false
  },

  className: 'Table-wrapper',
  tagName: 'div',

  initialize: function (opts) {
    if (!opts.queryGeometryModel) throw new Error('queryGeometryModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.columnsCollection) throw new Error('columnsCollection is required');
    if (!opts.rowsCollection) throw new Error('rowsCollection is required');
    if (!opts.modals) throw new Error('modals is required');

    this._rowsCollection = opts.rowsCollection;
    this._modals = opts.modals;
    this._columnsCollection = opts.columnsCollection;
    this._queryGeometryModel = opts.queryGeometryModel;
    this._querySchemaModel = opts.querySchemaModel;

    this._tableViewModel = new TableViewModel({
      relativePositionated: opts.relativePositionated,
      readonly: opts.readonly,
      tableName: opts.tableName
    }, {
      querySchemaModel: this._querySchemaModel
    });

    this._initBinds();

    var querySchemaStatus = this._querySchemaModel.get('status');
    var queryGeometryStatus = this._queryGeometryModel.get('status');

    if (queryGeometryStatus === 'unfetched') {
      this._queryGeometryModel.fetch();
    }

    if (querySchemaStatus === 'unfetched') {
      this._querySchemaModel.fetch();
    } else if (querySchemaStatus === 'fetched') {
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
    this._querySchemaModel.bind('change:query change:status', _.debounce(this._onChangeQueryOrStatus.bind(this), 100), this);
    this._querySchemaModel.bind('change:status', this._setDisableState, this);
    this._querySchemaModel.bind('change:query', this._onQueryChanged, this);
    this._querySchemaModel.bind('change:status', this._fetchRowsData, this);
    this._tableViewModel.bind('change:sort_order change:order_by', this._fetchRowsData, this);
    this.add_related_model(this._querySchemaModel);
    this.add_related_model(this._tableViewModel);
  },

  _setDisableState: function () {
    this.$('.js-table').toggleClass('is-disabled', !!this._tableViewModel.isDisabled());
  },

  _fetchRowsData: function (mdl) {
    var attrsChanged = mdl && _.keys(mdl.changed);
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
    var tableHeadView = new TableHeadView({
      modals: this._modals,
      queryGeometryModel: this._queryGeometryModel,
      columnsCollection: this._columnsCollection,
      tableViewModel: this._tableViewModel
    });

    this.addView(tableHeadView);
    this.$('.js-table').append(tableHeadView.render().el);

    var tableBodyView = new TableBodyView({
      modals: this._modals,
      columnsCollection: this._columnsCollection,
      rowsCollection: this._rowsCollection,
      queryGeometryModel: this._queryGeometryModel,
      querySchemaModel: this._querySchemaModel,
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

  // Remove elements that are not applied in the view
  remove: function () {
    $('.Table-paginator').remove();
    CoreView.prototype.remove.apply(this);
  },

  _onQueryChanged: function () {
    this._tableViewModel.resetFetchDefaults();
  }

});
