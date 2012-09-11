
(function() {

    /**
     * table view shown in admin
     */
    cdb.admin.TableView = cdb.ui.common.Table.extend({

      events: cdb.core.View.extendEvents({
          'click .sqlview .clearview': '_clearView',
          'click .sqlview .export_query': '_tableFromQuery'
      }),

      rowView: cdb.admin.RowView,

      initialize: function() {
         var self = this;
         this.constructor.__super__.initialize.apply(this);
         this.options.row_header = true;
         this.model.data().bind('newPage', this.newPage, this);
         var topReached = false;
         this._editorsOpened = null;

         // pagination
         setInterval(function() {
           if(!self.$el.is(":visible") || self.model.data().isFetchingPage()) {
             return;
           }
           var pos = $(this).scrollTop();
           var d = self.model.data();
           // do not let to fetch previous pages
           // until the user dont scroll back a little bit
           if(pos > 2) {
             topReached = false;
           }
           var pageSize = $(window).height() - self.$el.offset().top;
           var tableHeight = this.$('tbody').height();
           var realPos = pos + pageSize;
           if(tableHeight < pageSize) {
             return;
           }
           if(realPos > tableHeight) {
//              console.log(realPos, tableHeight, tableHeight - realPos);
              d.setPage(d.getPage() + 1);
           } else if (pos <= 0) {
             if(!topReached) {
               d.setPage(d.getPage() - 1);
             }
             topReached = true;
           }

         }, 2000);


        // Moving header and loaders when scrolls
        $(window).scroll(function(ev){
          // move header
          self.$el.find("thead > tr > th > div").css({marginLeft: -$(window).scrollLeft() + "px"});
        });


        this.model.data().bind('loadingRows', function(updown) {
          var fn = updown === 'up'? 'prepend': 'append';

          self.$el[fn]("<tfoot class='page_loader " + updown + "'><tr><th colspan='1'><div class='fake'></div><div class='float_info'><h5>Loading more rows</h5><p>Now viewing 120 of 264</p></div></th></tr></tfoot>");
        });

        this.model.data().bind('endLoadingRows', function() {
          self.$el.find('.page_loader').remove();
        });

        this.bind('cellClick', this._editCell, this);
        this.model.bind('change:dataSource', this._onSQLView, this);
        // when model changes the header is re rendered so the notice should be added
        this.model.bind('change', this._onSQLView, this);

      },

      _onSQLView: function() {
        // if we are in a SQL view add a header
        this.$('.sqlview').remove();
        if(this.model.isInSQLView()) {
          this.$('thead').append(
            this.getTemplate('table/views/sql_view_notice')()
          );
          this.$('thead > tr').css('height', 64 + 42);
        }
      },

      _clearView: function(e) {
        e.preventDefault();
        this.model.useSQLView(null);
        return false;
      },

      _tableFromQuery: function(e) {
        var self = this;
        e.preventDefault();
        //this.model.useSQLView(null);
        var dlg = new cdb.admin.TableNameDialog({
          ok: function(name) {
            var sql = self.model.data().getSQL();
            alert('to be done in backend');
            /*
            var table = cdb.admin.CartoDBTableMetadata.createFromQuery(name, sql);

            table.save(null, {
              success: function() {
              },
              error: function() {
                cdb.log.error("problem creating table from query");
              }
            });
            */
          }
        });
        dlg.appendToBody().show();
        return false;
        /*
        from_query:SELECT * FROM cb_municipios_5000_e limit 1
        name:asdasdasd
        */
      },


      _getEditor: function(columnType, opts) {
        var editors = {
          'string': cdb.admin.EditTextDialog,
          'number': cdb.admin.EditTextDialog,
          'date': cdb.admin.EditDateDialog,
          'geometry': cdb.admin.EditGeometryDialog
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
        var dlg = this._getEditor(columnType, {
          initial_value: self.model.data().getCell(y, column),
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

        dlg.showAt(offset.left, offset.top, width);
      },

      /**
       * called when a new page is loaded
       */
      newPage: function(currentPage, direction) {
         var d = this.model.data();
         var rowspp = d.options.get('rows_per_page');
         var max_items = rowspp*4;
         if(d.size() > max_items) {
           var idx = currentPage*rowspp;
           cdb.log.debug("removing rows: " + d.size() + " " + idx);
           if(direction == 'up') {
             d.remove(d.models.slice(max_items, d.size()));
           } else {
             d.remove(d.models.slice(0, idx));
           }
         }
      },

      headerView: function(column) {
        if(column[1] !== 'header') {
          var v = new cdb.admin.HeaderView({ column: column, table: this.model});
          this.addView(v);
          return v.render().el;
        } else {
          return '<div><div></div></div>';
        }
      }
    });

    cdb.admin.TableTab = cdb.core.View.extend({

      className: 'table',

      initialize: function() {
        this.tableView = new cdb.admin.TableView({
          dataModel: this.model.data(),
          model: this.model
        });
      },

      render: function() {
        this.$el.append(this.tableView.el);
        return this;
      }

    });

})();
