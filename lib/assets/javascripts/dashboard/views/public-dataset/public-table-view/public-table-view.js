const _ = require('underscore');
const $ = require('jquery');
const TableView = require('dashboard/views/public-dataset/table-view/table-view');
const PublicRowView = require('dashboard/views/public-dataset/public-table-view/public-row-view');
const PublicHeaderView = require('dashboard/views/public-dataset/public-table-view/public-header-view');
const templateEmptyDataset = require('./empty-table-public.tpl');

module.exports = TableView.extend({

  events: {},

  rowView: PublicRowView,

  initialize: function (opts) {
    TableView.prototype.initialize.call(this, opts);
    this.options.row_header = true;
    this._editorsOpened = null;

    this.initializeBindings();
    this.initPaginationAndScroll();
  },

  initializeBindings: function () {
    _.bindAll(this, 'render', 'rowSaving', 'addEmptyRow',
      '_checkEmptyTable', '_forceScroll', '_scrollMagic',
      'rowChanged', 'rowSynched', '_startPagination', '_finishPagination',
      'rowFailed', 'rowDestroyed', 'emptyTable');

    this.model.data().bind('newPage', this.newPage, this);

    // this.model.data().bind('loadingRows', this._startPagination);
    this.model.data().bind('endLoadingRows', this._finishPagination);

    this.bind('cellDblClick', this._editCell, this);

    // this.model.bind('change:dataSource', this._onSQLView, this);
    // when model changes the header is re rendered so the notice should be added
    // this.model.bind('change', this._onSQLView, this);
    this.model.bind('dataLoaded', () => {
      this._checkEmptyTable();
      this._forceScroll();
    }, this);
  },

  headerView: function (column) {
    if (column[1] !== 'header') {
      var v = new PublicHeaderView({
        column: column,
        table: this.model,
        sqlView: this.options.sqlView
      });

      this.addView(v);
      return v.render().el;
    } else {
      return '<div><div></div></div>';
    }
  },

  _onSQLView: function () {},

  _checkEmptyTable: function () {
    if (this.isEmptyTable()) {
      this.addEmptyTableInfo();
    } else {
      this.cleanEmptyTableInfo();
      this.$('footer').remove();
    }
  },

  _swicthEnabled: function () {
    // this check is not needed in public table
  },

  initPaginationAndScroll: function () {
    // disable scroll pagination, it's firing a function each 300 ms and it's not required on public table
  },

  addEmptyTableInfo: function () {
    var content = templateEmptyDataset(this.import_);

    var $footer = $('<tfoot><tr><td colspan="100">' + content + '</td></tr></tfoot>');
    this.$('footer').remove();
    this.$el.append($footer);
  },

  _scrollMagic: function () { }

});
