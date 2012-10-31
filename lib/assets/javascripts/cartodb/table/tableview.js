
(function() {

    /**
     * table view shown in admin
     */
    cdb.admin.TableView = cdb.ui.common.Table.extend({
      classLabel: 'cdb.admin.TableView',
      events: cdb.core.View.extendEvents({
          'click .clearview': '_clearView',
          'click .sqlview .export_query': '_tableFromQuery',
          'click .noRows': 'addEmptyRow'
      }),

      rowView: cdb.admin.RowView,

      initialize: function() {
        var self = this;
        this.elder('initialize');
        this.options.row_header = true;

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
        this.model.bind('change', this._onSQLView, this);
        this.model.bind('dataLoaded', function() {
          self._checkEmptyTable();
          self._forceScroll();
        });

        // If a query is applied and the panel is opened
        // we should show the query text a bit left.
        cdb.god.bind("hidePanel", function(ev) {
          self._moveQueryInfo("hide");
        });
        cdb.god.bind("showPanel", function(ev) {
          self._moveQueryInfo("show");
        });
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
        setInterval(function() {
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
        }, 1000);
      },

      render: function(args) {
        this.elder('render', args);
        this.trigger('render');
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
        // if we are in a SQL view add a header
        this.$('.sqlview').remove();
        if(this.model.isInSQLView()) {
          var empty = this.isEmptyTable();

          this.$('thead').append(
            this.getTemplate('table/views/sql_view_notice')({ empty: empty })
          );

          this.$('thead > tr').css('height', 64 + 42);
          if(this.isEmptyTable()) {
            this.addEmptySQLIfo();
          }
        }
      },

      _clearView: function(e) {
        e.preventDefault();
        this.trigger('clearSQLView');
        //this.model.useSQLView(null);
        return false;
      },

      _tableFromQuery: function(e) {
        e.preventDefault();

        var duplicate_dialog = new cdb.admin.DuplicateTable({
          model: this.model
        });

        $("body").append(duplicate_dialog.render().el);
        duplicate_dialog.open();
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
            this.$el.find("thead > tr > th > div").css({"marginLeft": "0px"})
            this.$el.find("thead div > div").css("top", actual_scroll_position.y + "px");
            this.scroll_position.last = "horizontal";
          }

        } else if (this.scroll_position.y != actual_scroll_position.y) {
          this.scroll_position.y = actual_scroll_position.y;
          this.$el.find("thead").removeClass("horizontal");

          // If last change was horizontal
          if (this.scroll_position.last == "horizontal") {
            this.$el.find("thead > tr > th > div")
              .css({"marginLeft": "-" + actual_scroll_position.x + "px"})
            this.$el.find("thead > tr > th > div > div").removeAttr('style')
            this.scroll_position.last = "vertical";
          }
        }
      },


      /**
       *  Move the query summary content if the panel is opened or hidden.
       */
      _moveQueryInfo: function(type) {
        if (this.model.isInSQLView()) {
          var $table_query_text = this.$el.find("div.sqlview p");
          if (type == "show") {
            $table_query_text.animate({textIndent: '-600px'}, 300);
          } else {
            $table_query_text.animate({textIndent: '0px'}, 300);
          }
        }
      },


      _getEditor: function(columnType, opts) {
        var editors = {
          'string': cdb.admin.EditStringDialog,
          'number': cdb.admin.EditNumberDialog,
          'date': cdb.admin.EditDateDialog,
          'geometry': cdb.admin.EditGeometryDialog,
          'boolean': cdb.admin.EditBooleanDialog
        };

        // clean previous if exits
        var view = this._editorsOpened;
        if(view) {
          view.clean();
        }

        var Editor = editors[columnType];
        this._editorsOpened = new Editor(opts);
        return this._editorsOpened;

      },

      _editCell: function(e, cell, x, y) {
        var self = this;
        if(this.model.data().isReadOnly()) {
          return;
        }
        var column = self.model.columnName(x-1);
        var columnType = this.model.getColumnType(column);

        if(this.model.isReservedColumn(column)) {
          return;
        }

        var row = self.model.data().getRowAt(y);

        var initial_value = '';
        if(self.model.data().getCell(y, column) === 0 || self.model.data().getCell(y, column) === '0') {
          initial_value = '0';
        } else if (self.model.data().getCell(y, column)) {
          initial_value = self.model.data().getCell(y, column);
        }

        // dont let generic editor
        if(column == 'the_geom') {
          columnType = 'geometry'
        }

        var dlg = this._getEditor(columnType, {
          initial_value: initial_value,
          row: row,
          res: function(val) {
            var update = {};
            update[column] = val;
            row.set(update).save();
          }
        });

        if(!dlg) {
          cdb.log.error("editor not defined for column type " + columnType);
          return;
        }

        // auto add to table view
        // Check first if the row is the first or the cell is the last :)
        var $td = $(e.target).closest("td")
          , offset = $td.position()
          , width = $td.outerWidth();

        if ($td.parent().index() == 0) {
          offset.top += 5;
        } else {
          offset.top -= 11;
        }

        if ($td.index() == ($td.size() - 1)) {
          offset.left -= 22;
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
            sqlView: this.options.sqlView
          }).bind('georeference', function(column) {
              var dlg = new cdb.admin.GeoreferenceDialog({
                model: this.table,
                wizard_option: 1, /** geocode using a column */
                georeference_column: column,
                geocoder: self.options.geocoder
              });
              dlg.appendToBody().open();
          });

          this.addView(v);
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


      /**
      * Adds the view elements associated with no content in the table
      * @method addemptyTableInfo
      */
      addEmptyTableInfo: function() {
        if(this.$('.noRows').length == 0 && !this.model.isInSQLView()) {
          this.elder('addEmptyTableInfo');

          this.$el.hide();
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

          this.template_base = cdb.templates.getTemplate('table/views/empty_table');
          var content = this.template_base(this.import_);
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
          this.elder('addEmptySQLInfo');
          this.$('tbody').html('');
          this.$('tfoot').remove();
          this.$el.hide();

          this.template_base = cdb.templates.getTemplate('table/views/empty_sql');
          var content = this.template_base(this.import_);
          var $footer = $('<tfoot><tr><td colspan="100">' + content + '</td></tr></tfoot>');
          this.$el.append($footer);

          this.$el.fadeIn();
        }
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
        this.model.notice('Saving your edit', 'load', this);
      },

      /**
      * Captures the change event from the row and produces a notification
      * @method rowSynched
      * @todo (xabel) i'm pretty sure there has to be a less convulted way of doing this, without capturing a event
      * to throw another event in the model to be captured by some view
      */
      rowSynched: function() {
        this.model.notice('Sucessfully saved');
      },

      /**
      * Captures the change event from the row and produces a notification
      * @method rowSynched
      * @todo (xabel) i'm pretty sure there has to be a less convulted way of doing this, without capturing a event
      * to throw another event in the model to be captured by some view
      */
      rowFailed: function() {
        this.model.notice('Oops, there has been an error saving your changes.');
      },

      /**
      * Captures the destroy event from the row and produces a notification
      * @method rowDestroyed
      */

      rowDestroyed: function() {
        this.model.notice('Sucessfully deleted')
        this._checkEmptyTable();
      }



    });



    /**
     * table tab controller
     */
    cdb.admin.TableTab = cdb.core.View.extend({

      className: 'table',
      tabClass: cdb.admin.TableView,

      initialize: function() {
        this.tableView = new this.tabClass({
          dataModel: this.model.data(),
          model: this.model,
          sqlView: this.options.sqlView,
          geocoder: this.options.geocoder
        });
      },

      render: function() {
        this.$el.append(this.tableView.el);
        return this;
      }

    });

})();
