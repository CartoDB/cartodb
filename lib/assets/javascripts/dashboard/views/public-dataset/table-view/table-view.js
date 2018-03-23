const $ = require('jquery');
const _ = require('underscore');
const CoreView = require('backbone/core-view');
const Table = require('dashboard/components/table/table');
const templateSQLViewNotice = require('./sql-view-notice.tpl');
const templateSQLLoading = require('./sql-loading.tpl');
const templateEmptySQL = require('./empty-sql.tpl');
const templateTablePaginationLoaders = require('./table-pagination-loaders.tpl');
const RowView = require('./row-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

module.exports = Table.extend({

  classLabel: 'cdb.admin.TableView',

  events: CoreView.extendEvents({
    'click .clearview': '_clearView',
    'click .sqlview .export_query': '_tableFromQuery',
    'click .noRows': 'addEmptyRow'
  }),

  rowView: RowView,

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    Table.prototype.initialize.call(this);
    this.options.row_header = true;
    this.globalError = this.options.globalError;
    this.vis = this.options.vis;
    this.user = this.options.user;
    this._editorsOpened = null;

    this.initializeBindings();

    this.initPaginationAndScroll();
  },

  /**
   * Append all the bindings needed for this view
   * @return undefined
   */
  initializeBindings: function () {
    _.bindAll(this, 'render', 'rowSaving', 'addEmptyRow',
      '_checkEmptyTable', '_forceScroll', '_scrollMagic',
      'rowChanged', 'rowSynched', '_startPagination', '_finishPagination',
      'rowFailed', 'rowDestroyed', 'emptyTable');

    this.model.data().bind('newPage', this.newPage, this);

    // this.model.data().bind('loadingRows', this._startPagination);
    this.model.data().bind('endLoadingRows', this._finishPagination);

    this.bind('cellDblClick', this._editCell, this);
    this.bind('createRow', () => {
      this._checkEmptyTable();
    });

    this.model.bind('change:dataSource', this._onSQLView, this);
    // when model changes the header is re rendered so the notice should be added
    // this.model.bind('change', this._onSQLView, this);
    this.model.bind('dataLoaded', () => {
      // this._checkEmptyTable();
      this._forceScroll();
    }, this);

    this.model.bind('change:permission', this._checkEmptyTable, this);

    this.model.bind('change:isSync', this._swicthEnabled, this);
    this._swicthEnabled();

    // Geocoder binding
    this.options.geocoder.bind('geocodingComplete geocodingError geocodingCanceled', function () {
      this.notice(_t('loaded'));
    }, this);
    this.add_related_model(this.options.geocoder);
  },

  initPaginationAndScroll: function () {
    var topReached = false;
    var bottomReached = false;

    // Initialize moving header and loaders when scrolls
    this.scroll_position = { x: $(window).scrollLeft(), y: $(window).scrollTop(), last: 'vertical' };
    $(window).scroll(this._scrollMagic);

    // Pagination
    var SCROLL_BACK_PIXELS = 2;
    this.checkScrollTimer = setInterval(() => {
      if (!this.$el.is(':visible') || this.model.data().isFetchingPage()) {
        return;
      }
      var pos = $(this).scrollTop();
      var d = this.model.data();
      // do not let to fetch previous pages
      // until the user dont scroll back a little bit
      // see comments below
      if (pos > SCROLL_BACK_PIXELS) {
        topReached = false;
      }
      var pageSize = $(window).height() - this.$el.offset().top;
      var tableHeight = this.$('tbody').height();
      var realPos = pos + pageSize;
      if (tableHeight < pageSize) {
        return;
      }
      // do not let to fetch previous pages
      // until the user dont scroll back a little bit
      // if we dont do this when the user reach the end of the page
      // and there are more rows than max_rows, the rows form the beggining
      // are removed and the scroll keeps at the bottom so a new page is loaded
      // doing this the user have to move the scroll a little bit (2 px)
      // in order to load the page again
      if (realPos < tableHeight - SCROLL_BACK_PIXELS) {
        bottomReached = false;
      }
      if (realPos >= tableHeight) {
        if (!bottomReached) {
          // Simulating loadingRows event
          if (!d.lastPage) this._startPagination('down');

          setTimeout(function () {
            d.loadPageAtBottom();
          }, 600);
        }
        bottomReached = true;
      } else if (pos <= 0) {
        if (!topReached) {
          // Simulating loadingRows event
          if (d.pages && d.pages[0] != 0) this._startPagination('up'); // eslint-disable-line eqeqeq

          setTimeout(function () {
            d.loadPageAtTop();
          }, 600);
        }
        topReached = true;
      }

      this._setUpPagination(d);
    }, 300);
    this.bind('clean', function () {
      clearInterval(this.checkScrollTimer);
    }, this);
  },

  needsRender: function (table) {
    if (!table) return true;
    var ca = table.changedAttributes();
    if (ca.geometry_types && _.keys(ca).length === 1) {
      return false;
    }
    return true;
  },

  render: function (args) {
    if (!this.needsRender(args)) return;
    Table.prototype.render.call(this, args);
    if (this.model.isInSQLView()) {
      this._onSQLView();
    }
    this._swicthEnabled();
    this.trigger('render');
  },

  _renderHeader: function () {
    var thead = Table.prototype._renderHeader.apply(this);
    // New custom shadow (better performance)
    thead.append($('<div>').addClass('shadow'));
    return thead;
  },

  addColumn: function (column) {
    this.newColumnName = 'column_' + new Date().getTime();

    this.model.addColumn(this.newColumnName, 'string');

    this.unbind('render', this._highlightColumn, this);
    this.bind('render', this._highlightColumn, this);
  },

  _highlightColumn: function () {
    if (this.newColumnName) {
      var $th = this.$("a[href='#" + this.newColumnName + "']").parents('th');
      var position = $th.index();

      if (position) {
        setTimeout(function () {
          var windowWidth = $(window).width();
          if ($th && $th.position()) {
            var centerPosition = $th.position().left - windowWidth / 2 + $th.width() / 2;
            $(window).scrollLeft(centerPosition);
          }
          this.$("[data-x='" + position + "']").addClass('is-highlighted');
        }, 300);

        this.unbind('render', this._highlightColumn, this);
      }
    }
  },

  /**
   *  Take care if the table needs space at top and bottom
   *  to show the loaders.
   */
  _setUpPagination: function (d) {
    var pages = d.pages;

    // Check if the table is not in the first page
    if (pages.length > 0 && pages[0] > 0) {
      // In that case, add the paginator-up loader and leave it ready
      // when it is necessary
      if (this.$el.find('tfoot.page_loader.up').length == 0) { // eslint-disable-line eqeqeq
        this.$el.append(templateTablePaginationLoaders({ direction: 'up' }));
      }
      // Table now needs some space at the top to show the loader
      this.$el.parent().addClass('page_up');
    } else {
      // Loader is not needed and table doesn't need any space at the top
      this.$el.parent().removeClass('page_up');
    }

    // Checks if we are in the last page
    if (!d.lastPage) {
      // If not, let's prepare the paginator-down
      if (this.$el.find('tfoot.page_loader.down').length == 0) { // eslint-disable-line eqeqeq
        this.$el.append(templateTablePaginationLoaders({ direction: 'down' }));
      }
      // Let's say to the table that we have paginator-down
      this.$el.parent().addClass('page_down');
    } else {
      // Loader is not needed and table doesn't need any space at the bottom
      this.$el.parent().removeClass('page_down');
    }
  },

  /**
   *  What to do when a pagination starts
   */
  _startPagination: function (updown) {
    // Loader... move on buddy!
    this.$el.find('.page_loader.' + updown + '').addClass('active');
  },

  /**
   *  What to do when a pagination finishes
   */
  _finishPagination: function (page, updown) {
    // If we are in a different page than 0, and we are paginating up
    // let's move a little bit the scroll to hide the loader again
    // HACKY
    if (page != 0 && updown == 'up') { // eslint-disable-line eqeqeq
      setTimeout(function () {
        $(window).scrollTop(180);
      }, 300);
    }

    this.$el.find('.page_loader.active').removeClass('active');
  },

  _onSQLView: function () {
    // bind each time we change dataSource because table unbind
    // all the events from sqlView object each time useSQLView is called
    this.$('.sqlview').remove();

    this.options.sqlView.unbind('reset error', this._renderSQLHeader, this);
    this.options.sqlView.unbind('loading', this._renderLoading, this);

    this.options.sqlView.bind('loading', this._renderLoading, this);
    this.options.sqlView.bind('reset', this._renderSQLHeader, this);
    this.options.sqlView.bind('error', this._renderSQLHeader, this);
    this._renderSQLHeader();
  },

  _renderLoading: function (opts) {
    opts = opts || {};
    this.cleanEmptyTableInfo();
    if (!opts.add) {
      this._renderBodyTemplate(templateSQLLoading);
    }
  },

  _renderSQLHeader: function () {
    if (this.model.isInSQLView()) {
      var empty = this.isEmptyTable();
      this.$('thead').find('.sqlview').remove();
      this.$('thead').append(
        templateSQLViewNotice({
          empty: empty,
          isVisualization: this.vis.isVisualization(),
          warnMsg: null
        })
      );

      this.$('thead > tr').css('height', 64 + 42);
      if (this.isEmptyTable()) {
        this.addEmptySQLIfo();
      }

      this._moveInfo();
    }
  },

  // depending if the sync is enabled add or remove a class
  _swicthEnabled: function () {
    // Synced?
    this.$el[ this.model.isSync() ? 'addClass' : 'removeClass' ]('synced');
    // Visualization?
    this.$el[ this.vis.isVisualization() ? 'addClass' : 'removeClass' ]('vis');
  },

  _clearView: function (e) {
    if (e) e.preventDefault();
    this.options.layer.clearSQLView();
    return false;
  },

  _tableFromQuery: function (e) {
    throw new Error('Method not migrated, check original implementation');
  },

  /**
   *  Function to control the scroll in the table (horizontal and vertical)
   */
  _scrollMagic: function (ev) {
    var actual_scroll_position = { x: $(window).scrollLeft(), y: $(window).scrollTop() };

    if (this.scroll_position.x != actual_scroll_position.x) { // eslint-disable-line eqeqeq
      this.scroll_position.x = actual_scroll_position.x;
      this.$el.find('thead').addClass('horizontal');

      // If last change was vertical
      if (this.scroll_position.last == 'vertical') { // eslint-disable-line eqeqeq
        this.scroll_position.x = actual_scroll_position.x;

        this.$el.find('thead > tr > th > div > div:not(.dropdown)')
          .removeAttr('style')
          .css('top', actual_scroll_position.y + 'px');

        this.scroll_position.last = 'horizontal';
      }
    } else if (this.scroll_position.y != actual_scroll_position.y) { // eslint-disable-line eqeqeq
      this.scroll_position.y = actual_scroll_position.y;
      this.$el.find('thead').removeClass('horizontal');

      // If last change was horizontal
      if (this.scroll_position.last == 'horizontal') { // eslint-disable-line eqeqeq
        this.$el.find('thead > tr > th > div > div:not(.dropdown)')
          .removeAttr('style')
          .css({'marginLeft': '-' + actual_scroll_position.x + 'px'});

        this.scroll_position.last = 'vertical';
      }
    }
  },

  /**
   *  Move the info content if the panel is opened or hidden.
   *  - Query info if query is applied
   *  - Query loader if query is appliying in that moment
   *  - Add some padding to last column of the content to show them
   */
  _moveInfo: function (type) {
    if (type == 'show') { // eslint-disable-line eqeqeq
      this.$el
        .removeClass('narrow')
        .addClass('displaced');
    } else if (type == 'narrow') { // eslint-disable-line eqeqeq
      this.$el.addClass('displaced narrow');
    } else if (type == 'hide') { // eslint-disable-line eqeqeq
      this.$el.removeClass('displaced narrow');
    } else {
      // Check from the beginning if the right menu is openned, isOpen from
      // the menu is not working properly
      if ($('.table_panel').length > 0) {
        var opened = $('.table_panel').css('right').replace('px', '') == 0; // eslint-disable-line eqeqeq
        if (!opened) {
          this.$el.removeClass('displaced');
        }
      }
    }
  },

  _getEditor: function (columnType, opts) {
    throw new Error('Method not migrated, check original implementation');
  },

  closeEditor: function () {
    if (this._editorsOpened) {
      this._editorsOpened.hide();
      this._editorsOpened.clean();
    }
  },

  _editCell: function (e, cell, x, y) {
    throw new Error('Method not migrated, check original implementation');
  },

  headerView: function (column) {
    throw new Error('Method not migrated, check original implementation');
  },

  /**
  * Checks if the table has any rows, and if not, launch the method for showing the appropiate view elements
  * @method _checkEmptyTable
  */
  _checkEmptyTable: function () {
    if (this.isEmptyTable()) {
      this.addEmptyTableInfo();
    } else {
      this.cleanEmptyTableInfo();
    }
  },

  /**
  * Force the table to be at the beginning
  * @method _forceScroll
  */
  _forceScroll: function (ev) {
    $(window).scrollLeft(0);
  },

  _renderEmpty: function () {
    this.addEmptyTableInfo();
  },

  /**
  * Adds the view elements associated with no content in the table
  * @method addemptyTableInfo
  */
  addEmptyTableInfo: function () {
    throw new Error('Method not migrated, check original implementation');
  },

  /**
  * Adds the view elements associated with no content in the table when a SQL is applied
  * @method addEmptySQLIfo
  */
  addEmptySQLIfo: function () {
    if (this.model.isInSQLView()) {
      this._renderBodyTemplate(templateEmptySQL);
    }
  },

  _renderBodyTemplate: function (template) {
    this.$('tbody').html('');
    this.$('tfoot').remove();
    this.$el.hide();

    // Check if panel is opened to move the loader some bit left
    var panel_opened = false;
    if ($('.table_panel').length > 0) {
      panel_opened = $('.table_panel').css('right').replace('px', '') == 0; // eslint-disable-line eqeqeq
    }

    var content = template({ config: this._configModel, panel_opened });
    var $footer = $('<tfoot class="sql_loader"><tr><td colspan="100">' + content + '</td></tr></tfoot>');

    this.$el.append($footer);
    this.$el.fadeIn();
  },

  /**
  * Removes from the view the no-content elements
  * @method cleanEmptyTableInfo
  */
  cleanEmptyTableInfo: function () {
    this.$('tfoot').fadeOut('fast', function () {
      $(this).remove();
    });
    this.$('.noRows').slideUp('fast', function () {
      $(this).remove();
    });
  },

  notice: function (text, type, time) {
    this.globalError.showError(text, type, time);
  },

  /**
  * Add a new row and removes the empty table view elemetns
  * @method addEmptyRow
  * @todo: (xabel) refactor this to include a "addRow" method in _models[0]
  */
  addEmptyRow: function () {
    this.dataModel.addRow({ at: 0 });
    this.cleanEmptyTableInfo();
  },

  /**
  * Captures the saving event from the row and produces a notification
  * @todo (xabel) i'm pretty sure there has to be a less convulted way of doing this, without capturing a event
  * to throw another event in the model to be captured by some view
  */
  rowSaving: function () {
    this.notice('Saving your edit', 'load', -1);
  },

  /**
  * Captures the change event from the row and produces a notification
  * @method rowSynched
  * @todo (xabel) i'm pretty sure there has to be a less convulted way of doing this, without capturing a event
  * to throw another event in the model to be captured by some view
  */
  rowSynched: function () {
    this.notice('Sucessfully saved');
  },

  /**
  * Captures the change event from the row and produces a notification
  * @method rowSynched
  * @todo (xabel) i'm pretty sure there has to be a less convulted way of doing this, without capturing a event
  * to throw another event in the model to be captured by some view
  */
  rowFailed: function () {
    this.notice('Oops, there has been an error saving your changes.', 'error');
  },

  /**
  * Captures the destroy event from the row and produces a notification
  * @method rowDestroyed
  */

  rowDestroying: function () {
    this.notice('Deleting row', 'load', -1);
  },

  /**
  * Captures the sync after a destroy event from the row and produces a notification
  * @method rowDestroyed
  */

  rowDestroyed: function () {
    this.notice('Sucessfully deleted');
    this._checkEmptyTable();
  }
});
