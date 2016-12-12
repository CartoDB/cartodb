
  /**
   * public table view
   */
  cdb.open.PublicTableView = cdb.admin.TableView.extend({
    
    events: {},

    rowView: cdb.open.PublicRowView,

    initialize: function() {
      var self = this;
      this.elder('initialize');
      this.options.row_header = true;
      this._editorsOpened = null;

      this.initializeBindings();
      this.initPaginationAndScroll();
    },

    initializeBindings: function() {
      var self = this;

      _.bindAll(this, "render", "rowSaving", "addEmptyRow",
        "_checkEmptyTable", "_forceScroll", "_scrollMagic",
        "rowChanged", "rowSynched", "_startPagination", "_finishPagination",
        "rowFailed", "rowDestroyed", "emptyTable");

      this.model.data().bind('newPage', this.newPage, this);

      //this.model.data().bind('loadingRows', this._startPagination);
      this.model.data().bind('endLoadingRows', this._finishPagination);

      this.bind('cellDblClick', this._editCell, this);

      //this.model.bind('change:dataSource', this._onSQLView, this);
      // when model changes the header is re rendered so the notice should be added
      //this.model.bind('change', this._onSQLView, this);
      this.model.bind('dataLoaded', function() {
        self._checkEmptyTable();
        self._forceScroll();
      }, this);
    },

    headerView: function(column) {
      var self = this;
      if(column[1] !== 'header') {
        var v = new cdb.open.PublicHeaderView({
          column: column,
          table: this.model,
          sqlView: this.options.sqlView,
        });

        this.addView(v);
        return v.render().el;
      } else {
        return '<div><div></div></div>';
      }
    },

    _onSQLView: function() {},

    _checkEmptyTable: function() {
      if(this.isEmptyTable()) {
        this.addEmptyTableInfo();
      } else {
        this.cleanEmptyTableInfo();
        this.$('footer').remove();
      }
    },

    _swicthEnabled: function() {
      // this check is not needed in public table
    },

    addEmptyTableInfo: function() {
      this.template_base = cdb.templates.getTemplate('public_table/views/empty_table_public');
      var content = this.template_base(this.import_);

      var $footer = $('<tfoot><tr><td colspan="100">' + content + '</td></tr></tfoot>');
      this.$('footer').remove();
      this.$el.append($footer);
    },

    _scrollMagic: function() { }

  });

  /**
   *  Public table tab controller
   */

  cdb.open.PublicTableTab = cdb.admin.TableTab.extend({

    className: 'table public',

    initialize: function() {
      this.user = this.options.user;
      this.sqlView = this.options.sqlView;
    },

    _createTable: function() {
      this.tableView = new cdb.open.PublicTableView({
        dataModel: this.model.data(),
        model: this.model,
        sqlView: this.sqlView
      });
    }
  });
