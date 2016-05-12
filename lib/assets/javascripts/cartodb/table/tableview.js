
(function() {

    /**
     * table view shown in admin
     */
    cdb.admin.TableView = cdb.ui.common.Table.extend({

      classLabel: 'cdb.admin.TableView',

      events: cdb.core.View.extendEvents({
          'click .clearview': '_clearView',
          'click .sqlview .export_query': '_tableFromQuery',
          'click .sqlview .dismiss': '_dismissSQLHeader',
          'click .noRows': 'addEmptyRow'
      }),

      rowView: cdb.admin.RowView,

      initialize: function() {
        var self = this;
        this.elder('initialize');
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
        this.bind('createRow', function() {
          self._checkEmptyTable();
        });


        this.model.bind('change:dataSource', this._onSQLView, this);
        // when model changes the header is re rendered so the notice should be added
        //this.model.bind('change', this._onSQLView, this);
        this.model.bind('dataLoaded', function() {
          //self._checkEmptyTable();
          self._forceScroll();
        }, this);

        this.model.bind('change:permission', this._checkEmptyTable, this);

        this.model.bind('change:isSync', this._swicthEnabled, this);
        this._swicthEnabled();

        // Actions triggered in the right panel
        cdb.god.bind("panel_action", function(action) {
          self._moveInfo(action);
        }, this);
        this.add_related_model(cdb.god);

        // Geocoder binding
        this.options.geocoder.bind('geocodingComplete geocodingError geocodingCanceled', function() {
          this.notice(_t('loaded'));
        }, this);
        this.add_related_model(this.options.geocoder);
      },

      initPaginationAndScroll: function() {
        var self = this;
        var topReached = false;
        var bottomReached = false;

        // Initialize moving header and loaders when scrolls
        this.scroll_position = { x:$(window).scrollLeft(), y:$(window).scrollTop(), last: 'vertical' };
        $(window).scroll( this._scrollMagic );

        // Pagination
        var SCROLL_BACK_PIXELS = 2;
        this.checkScrollTimer = setInterval(function() {
          if(!self.$el.is(":visible") || self.model.data().isFetchingPage()) {
            return;
          }
          var pos = $(this).scrollTop();
          var d = self.model.data();
          // do not let to fetch previous pages
          // until the user dont scroll back a little bit
          // see comments below
          if(pos > SCROLL_BACK_PIXELS) {
            topReached = false;
          }
          var pageSize = $(window).height() - self.$el.offset().top;
          var tableHeight = this.$('tbody').height();
          var realPos = pos + pageSize;
          if(tableHeight < pageSize) {
            return;
          }
          // do not let to fetch previous pages
          // until the user dont scroll back a little bit
          // if we dont do this when the user reach the end of the page
          // and there are more rows than max_rows, the rows form the beggining
          // are removed and the scroll keeps at the bottom so a new page is loaded
          // doing this the user have to move the scroll a little bit (2 px)
          // in order to load the page again
          if(realPos < tableHeight - SCROLL_BACK_PIXELS) {
            bottomReached = false;
          }
          if(realPos >= tableHeight) {
            if(!bottomReached) {
              // Simulating loadingRows event
              if (!d.lastPage) self._startPagination('down');

              setTimeout(function() {
                d.loadPageAtBottom();
              },600);
            }
            bottomReached = true;
          } else if (pos <= 0) {
            if(!topReached) {
              // Simulating loadingRows event
              if (d.pages && d.pages[0] != 0) self._startPagination('up');

              setTimeout(function() {
                d.loadPageAtTop()
              },600);
            }
            topReached = true;
          }

          self._setUpPagination(d);
        }, 300);
        this.bind('clean', function() {
          clearInterval(this.checkScrollTimer);
        }, this);
      },

      needsRender: function(table) {
        if (!table) return true;
        var ca = table.changedAttributes();
        if (ca.geometry_types && _.keys(ca).length === 1) {
          return false;
        }
        return true;
      },

      render: function(args) {
        if (!this.needsRender(args)) return;
        this.elder('render', args);
        if (this.model.isInSQLView()) {
          this._onSQLView();
        }
        this._swicthEnabled();
        this.trigger('render');
      },

      _renderHeader: function() {
        var thead = cdb.ui.common.Table.prototype._renderHeader.apply(this);
        // New custom shadow (better performance)
        thead.append($('<div>').addClass('shadow'));
        return thead;
      },

      addColumn: function(column){
        this.newColumnName = "column_" + new Date().getTime();

        this.model.addColumn(this.newColumnName, 'string');

        this.unbind("render", this._highlightColumn, this);
        this.bind("render", this._highlightColumn, this);
      },

      _highlightColumn: function() {

        if (this.newColumnName) {

          var $th = this.$("a[href='#" + this.newColumnName + "']").parents("th");
          var position = $th.index();

          if (position) {

            setTimeout(function() {
              var windowWidth = $(window).width();
              if ($th && $th.position()) {
                var centerPosition = $th.position().left - windowWidth/2 + $th.width()/2;
                $(window).scrollLeft(centerPosition);
              }
              this.$("[data-x='" + position + "']").addClass("is-highlighted");
            }, 300);

            this.unbind("render", this._highlightColumn, this);
          }
        }
      },

      /**
       *  Take care if the table needs space at top and bottom
       *  to show the loaders.
       */
      _setUpPagination: function(d) {
        var pages = d.pages;

        // Check if the table is not in the first page
        if (pages.length > 0 && pages[0] > 0) {
          // In that case, add the paginator-up loader and leave it ready
          // when it is necessary
          if (this.$el.find('tfoot.page_loader.up').length == 0) {
            this.$el.append(this.getTemplate('table/views/table_pagination_loaders')({ direction: 'up' }));
          }
          // Table now needs some space at the top to show the loader
          this.$el.parent().addClass("page_up");
        } else {
          // Loader is not needed and table doesn't need any space at the top
          this.$el.parent().removeClass("page_up");
        }

        // Checks if we are in the last page
        if (!d.lastPage) {
          // If not, let's prepare the paginator-down
          if (this.$el.find('tfoot.page_loader.down').length == 0) {
            this.$el.append(this.getTemplate('table/views/table_pagination_loaders')({ direction: 'down' }));
          }
          // Let's say to the table that we have paginator-down
          this.$el.parent().addClass("page_down");
        } else {
          // Loader is not needed and table doesn't need any space at the bottom
          this.$el.parent().removeClass("page_down");
        }
      },


      /**
       *  What to do when a pagination starts
       */
      _startPagination: function(updown) {
        // Loader... move on buddy!
        this.$el.find(".page_loader." + updown + "").addClass('active');
      },

      /**
       *  What to do when a pagination finishes
       */
      _finishPagination: function(page, updown) {

        // If we are in a different page than 0, and we are paginating up
        // let's move a little bit the scroll to hide the loader again
        // HACKY
        if (page != 0 && updown == "up") {
          setTimeout(function(){
            $(window).scrollTop(180);
          },300);
        }

        this.$el.find('.page_loader.active').removeClass('active');
      },


      _onSQLView: function() {
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

      _renderLoading: function(opts) {
        opts = opts || {};
        this.cleanEmptyTableInfo();
        if(!opts.add) {
          this._renderBodyTemplate('table/views/sql_loading');
        }
      },

      _renderSQLHeader: function() {
        var self = this;
        if(self.model.isInSQLView() && self.model.showSqlBanner) {
          var empty = self.isEmptyTable();
          self.$('thead').find('.sqlview').remove();
          self.$('thead').append(
            self.getTemplate('table/views/sql_view_notice')({
              empty: empty,
              isVisualization: self.vis.isVisualization(),
              warnMsg: null
            })
          );

          self.$('thead > tr').css('height', 64 + 42);
          if(self.isEmptyTable()) {
            self.addEmptySQLIfo();
          }

          self._moveInfo();
        }
      },

      _dismissSQLHeader: function (e) {
        this.killEvent(e);
        this.$('thead').find('.sqlview').remove();
        this.$('thead > tr').css('height', '');
        this.model.showSqlBanner = false;
      },

      // depending if the sync is enabled add or remove a class
      _swicthEnabled: function() {
        // Synced?
        this.$el[ this.model.isSync() ? 'addClass' : 'removeClass' ]('synced');
        // Visualization?
        this.$el[ this.vis.isVisualization() ? 'addClass' : 'removeClass' ]('vis');
      },

      _clearView: function(e) {
        if (e) e.preventDefault();
        this.options.layer.clearSQLView();
        return false;
      },

      _tableFromQuery: function(e) {
        e.preventDefault();

        var duplicate_dialog = new cdb.editor.DuplicateDatasetView({
          model: this.model,
          user: this.user,
          clean_on_hide: true
        });
        duplicate_dialog.appendToBody();
      },


      /**
       *  Function to control the scroll in the table (horizontal and vertical)
       */
      _scrollMagic: function(ev) {
        var actual_scroll_position = { x:$(window).scrollLeft(), y:$(window).scrollTop() };

        if (this.scroll_position.x != actual_scroll_position.x) {
          this.scroll_position.x = actual_scroll_position.x;
          this.$el.find("thead").addClass("horizontal");

          // If last change was vertical
          if (this.scroll_position.last == "vertical") {
            this.scroll_position.x = actual_scroll_position.x;

            this.$el.find("thead > tr > th > div > div:not(.dropdown)")
              .removeAttr("style")
              .css("top", actual_scroll_position.y + "px");

            this.scroll_position.last = "horizontal";
          }

        } else if (this.scroll_position.y != actual_scroll_position.y) {
          this.scroll_position.y = actual_scroll_position.y;
          this.$el.find("thead").removeClass("horizontal");

          // If last change was horizontal
          if (this.scroll_position.last == "horizontal") {

            this.$el.find("thead > tr > th > div > div:not(.dropdown)")
              .removeAttr('style')
              .css({"marginLeft": "-" + actual_scroll_position.x + "px"});

            this.scroll_position.last = "vertical";
          }
        }
      },


      /**
       *  Move the info content if the panel is opened or hidden.
       *  - Query info if query is applied
       *  - Query loader if query is appliying in that moment
       *  - Add some padding to last column of the content to show them
       */
      _moveInfo: function(type) {
        if (type == "show") {
          this.$el
            .removeClass('narrow')
            .addClass('displaced');
        } else if (type == "narrow") {
          this.$el.addClass('displaced narrow')
        } else if (type == "hide") {
          this.$el.removeClass('displaced narrow');
        } else {
          // Check from the beginning if the right menu is openned, isOpen from
          // the menu is not working properly
          if ($('.table_panel').length > 0) {
            var opened = $('.table_panel').css("right").replace("px","") == 0 ? true : false;
            if (!opened) {
              this.$el.removeClass('displaced');
            }
          }
        }
      },

      _getEditor: function(columnType, opts) {
        var editors = {
          'string':                       cdb.admin.StringField,
          'number':                       cdb.admin.NumberField,
          'date':                         cdb.admin.DateField,
          'geometry':                     cdb.admin.GeometryField,
          'timestamp with time zone':     cdb.admin.DateField,
          'timestamp without time zone':  cdb.admin.DateField,
          'boolean':                      cdb.admin.BooleanField
        };

        var editorExists = _.filter(editors, function(a,i) { return i === columnType }).length > 0;

        if(columnType !== "undefined" && editorExists) {
          return editors[columnType];
        } else {
          return editors['string']
        }
      },


      closeEditor: function() {
        if (this._editorsOpened) {
          this._editorsOpened.hide();
          this._editorsOpened.clean();
        }
      },


      _editCell: function(e, cell, x, y) {
        var self = this;

        // Clean and close previous cell editor
        this.closeEditor();

        var column = self.model.columnName(x-1);
        var columnType = this.model.getColumnType(column);

        if (this.model.isReservedColumn(column) && !this.model.isReadOnly() && columnType!='geometry') {
          return;
        }

        var row = self.model.data().getRowAt(y);

        var initial_value = '';
        if(self.model.data().getCell(y, column) === 0 || self.model.data().getCell(y, column) === '0') {
          initial_value = '0';
        } else if (self.model.data().getCell(y, column) !== undefined) {
          initial_value = self.model.data().getCell(y, column);
        }

        // dont let generic editor
        if(column == 'the_geom') {
          columnType = 'geometry'
        }

        var prevRow = _.clone(row.toJSON());

        var dlg = this._editorsOpened = new cdb.admin.SmallEditorDialog({
          value:        initial_value,
          column:       column,
          row:          row,
          rowNumber:    y,
          readOnly:     this.model.isReadOnly(),
          editorField:  this._getEditor(columnType),
          res: function(new_value) {
            if(!_.isEqual(new_value, prevRow[column])) {
              // do not use save error callback since it avoid model error method to be called
              row.bind('error', function editError() {
                row.unbind('error', editError);
                // restore previopis on error
                row.set(column, prevRow[column]);
              });
              row
                .save(column, new_value)
                .done(function(a){
                  self.model.trigger('data:saved');
                });
            }
          }
        });

        if(!dlg) {
          cdb.log.error("editor not defined for column type " + columnType);
          return;
        }

        // auto add to table view
        // Check first if the row is the first or the cell is the last :)
        var $td = $(e.target).closest("td")
          , offset = $td.offset()
          , $tr = $(e.target).closest("tr")
          , width = Math.min($td.outerWidth(), 278);

        // Remove header spacing from top offset
        offset.top = offset.top - this.$el.offset().top;

        if ($td.parent().index() == 0) {
          offset.top += 5;
        } else {
          offset.top -= 11;
        }

        if ($td.index() == ($tr.find("td").size() - 1) && $tr.find("td").size() < 2) {
          offset.left -= width/2;
        } else {
          offset.left -= 11;
        }

        dlg.showAt(offset.left, offset.top, width, true);
      },


      headerView: function(column) {
        var self = this;

        if(column[1] !== 'header') {
          var v = new cdb.admin.HeaderView({
            column: column,
            table: this.model,
            sqlView: this.options.sqlView,
            user: this.user,
            vis: this.vis
          })
          .bind('clearView', this._clearView, this)
          .bind('georeference', function(column) {
            var dlg;
            var bkgPollingModel = this.options.backgroundPollingModel;
            var tableIsReadOnly = this.model.isSync();
            var canAddGeocoding = bkgPollingModel !== "" ? bkgPollingModel.canAddGeocoding() : true; // With new modals

            if (!this.options.geocoder.isGeocoding() && !tableIsReadOnly && canAddGeocoding) {
              var dlg = new cdb.editor.GeoreferenceView({
                table:  this.model,
                user:   this.user,
                tabs:   ['lonlat', 'city', 'admin', 'postal', 'ip', 'address'],
                option: 'lonlat',
                data:   { longitude: column }
              });

            } else if (this.options.geocoder.isGeocoding() || ( !canAddGeocoding && !tableIsReadOnly )) {
              dlg = cdb.editor.ViewFactory.createDialogByTemplate('common/background_polling/views/geocodings/geocoding_in_progress');
            } else {
              // If table can't geocode == is synched, return!
              return;
            }

            dlg.appendToBody();
          }, this)
          .bind('applyFilter', function(column) {
            self.options.menu.show('filters_mod');
            self.options.layer.trigger('applyFilter',column);
          }, this)

          this.addView(v);

          if (this.newColumnName == column[0]) {
            setTimeout(function() {
              v.renameColumn();
              self.newColumnName = null;
            }, 300);
          }

          return v.render().el;
        } else {
          return '<div><div></div></div>';
        }
      },


      /**
      * Checks if the table has any rows, and if not, launch the method for showing the appropiate view elements
      * @method _checkEmptyTable
      */
      _checkEmptyTable: function() {
        if(this.isEmptyTable()) {
          this.addEmptyTableInfo();
        } else {
          this.cleanEmptyTableInfo();
        }
      },


      /**
      * Force the table to be at the beginning
      * @method _forceScroll
      */
      _forceScroll: function(ev){
        $(window).scrollLeft(0);
      },

      _renderEmpty: function() {
        this.addEmptyTableInfo();
      },

      /**
      * Adds the view elements associated with no content in the table
      * @method addemptyTableInfo
      */
      addEmptyTableInfo: function() {
        if(this.$('.noRows').length == 0 && !this.model.isInSQLView() && this.model.get('schema')) {
          this.elder('addEmptyTableInfo');

          this.$el.hide();

          // Fake empty row if the table is not readonly
          if (!this.model.isReadOnly()) {
            //TODO: use row view instead of custom HTML
            var columnsNumber = this.model.get('schema').length;
            var columns = '<tr class="placeholder noRows"><td class="addNewRow">+</td>';
            for(var i = 0; i < columnsNumber; i++) {
              columns += '<td></td>';
            }
            columns += '</tr>';
            var columnsFooter = '<tr class="placeholder noRows decoration"><td></td>';
            for(var i = 0; i < columnsNumber; i++) {
              columnsFooter += '<td></td>';
            }
            columnsFooter += '</tr>';

            var $columns = $(columns+columnsFooter)
            this.$el.append($columns);
          }

          this.template_base = cdb.templates.getTemplate( this.model.isReadOnly() ? 'table/views/empty_readtable_info' : 'table/views/empty_table');
          var content = this.template_base();
          var $footer = $('<tfoot><tr><td colspan="100">' + content + '</td></tr></tfoot>');
          this.$el.append($footer);

          this.$el.fadeIn();
        }
      },

      /**
      * Adds the view elements associated with no content in the table when a SQL is applied
      * @method addEmptySQLIfo
      */
      addEmptySQLIfo: function() {
        if(this.model.isInSQLView()) {
          this._renderBodyTemplate('table/views/empty_sql');
        }
      },

      _renderBodyTemplate: function(tmpl) {
        this.$('tbody').html('');
        this.$('tfoot').remove();
        this.$el.hide();

        // Check if panel is opened to move the loader some bit left
        var panel_opened = false;
        if ($('.table_panel').length > 0) {
          panel_opened = $('.table_panel').css("right").replace("px","") == 0 ? true : false;
        }

        var content = cdb.templates.getTemplate(tmpl)({ panel_opened: panel_opened })
        , $footer = $('<tfoot class="sql_loader"><tr><td colspan="100">' + content + '</td></tr></tfoot>');

        this.$el.append($footer);
        this.$el.fadeIn();
      },

      /**
      * Removes from the view the no-content elements
      * @method cleanEmptyTableInfo
      */
      cleanEmptyTableInfo: function() {
        this.$('tfoot').fadeOut('fast', function() {
          $(this).remove();
        })
        this.$('.noRows').slideUp('fast', function() {
          $(this).remove();
        })
      },

      notice: function(text, type, time) {
        this.globalError.showError(text, type, time);
      },

      /**
      * Add a new row and removes the empty table view elemetns
      * @method addEmptyRow
      * @todo: (xabel) refactor this to include a "addRow" method in _models[0]
      */
      addEmptyRow: function() {
        this.dataModel.addRow({ at: 0});
        this.cleanEmptyTableInfo();
      },

      /**
      * Captures the saving event from the row and produces a notification
      * @todo (xabel) i'm pretty sure there has to be a less convulted way of doing this, without capturing a event
      * to throw another event in the model to be captured by some view
      */
      rowSaving: function() {
        this.notice('Saving your edit', 'load', -1);
      },

      /**
      * Captures the change event from the row and produces a notification
      * @method rowSynched
      * @todo (xabel) i'm pretty sure there has to be a less convulted way of doing this, without capturing a event
      * to throw another event in the model to be captured by some view
      */
      rowSynched: function() {
        this.notice('Sucessfully saved');
      },

      /**
      * Captures the change event from the row and produces a notification
      * @method rowSynched
      * @todo (xabel) i'm pretty sure there has to be a less convulted way of doing this, without capturing a event
      * to throw another event in the model to be captured by some view
      */
      rowFailed: function() {
        this.notice('Oops, there has been an error saving your changes.', 'error');
      },

      /**
      * Captures the destroy event from the row and produces a notification
      * @method rowDestroyed
      */

      rowDestroying: function() {
        this.notice('Deleting row', 'load', -1)
      },

      /**
      * Captures the sync after a destroy event from the row and produces a notification
      * @method rowDestroyed
      */

      rowDestroyed: function() {
        this.notice('Sucessfully deleted')
        this._checkEmptyTable();
      }
    });



    /**
    * table tab controller
    */
    cdb.admin.TableTab = cdb.core.View.extend({

      className: 'table',

      initialize: function() {
        this.user = this.options.user;
        this.sqlView = this.options.sqlView;
        this.geocoder = this.options.geocoder;
        this.backgroundPollingModel = this.options.backgroundPollingModel;
        this._initBinds();
      },

      setActiveLayer: function(layerView) {
        var recreate = !!this.tableView;
        this.deactivated();
        this.model = layerView.table;
        this.layer = layerView.model;
        this.sqlView = layerView.sqlView;
        if(recreate) {
          this.activated();
        }
      },

      _initBinds: function() {
        // Geocoder binding
        this.geocoder.bind('geocodingComplete geocodingError geocodingCanceled', function() {
          if (this.model.data) {
            this.model.data().refresh()
          }
        }, this);
        this.add_related_model(this.geocoder);
      },

      _createTable: function() {
        this.tableView = new cdb.admin.TableView({
          dataModel: this.model.data(),
          model: this.model,
          sqlView: this.sqlView,
          layer: this.layer,
          geocoder: this.options.geocoder,
          backgroundPollingModel: this.backgroundPollingModel,
          vis: this.options.vis,
          menu: this.options.menu,
          user: this.user,
          globalError: this.options.globalError
        });
      },

      activated: function() {
        if(!this.tableView) {
          this._createTable();
          this.tableView.render();
          this.render();
        }
      },

      deactivated: function() {
        if(this.tableView) {
          this.tableView.clean();
          this.tableView = null;
          this.hasRenderedTableView = false;
        }
      },

      render: function() {
        // Since render should be idempotent (i.e. should not append the tableView twice when called multiple times)
        if(this.tableView && !this.hasRenderedTableView) {
          this.hasRenderedTableView = true;
          this.$el.append(this.tableView.el);
        }
        return this;
      }


    });

})();
