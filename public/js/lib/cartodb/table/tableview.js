
(function() {

    var HeaderDropdown = cdb.admin.UserMenu.extend({ 

      events: {
        'click .asc': 'orderColumnsAsc',
        'click .desc': 'orderColumnsDesc',
        'click .rename_column': 'renameColumn',
        'click .change_data_type': 'changeType',
        'click .georeference': 'georeference',
        'click .filter_by_this_column': 'filterColumn',
        'click .delete_column': 'deleteColumn'
      },

      setTable: function(table, column) {
        this.table = table;
        this.column = column;

        //set options for ordering
        if(table.data().options.get('mode') === 'asc') {
          this.$('.asc').addClass('selected');
          this.$('.desc').removeClass('selected');
        } else {
          this.$('.desc').addClass('selected');
          this.$('.asc').removeClass('selected');
        }

      },

      orderColumnsAsc: function(e) { 
        e.preventDefault();
        this.table.data().setOptions({
          mode: 'asc',
          order_by: this.column
        });
        this.hide();
        return false;
      },

      orderColumnsDesc: function(e) { 
        e.preventDefault();
        this.table.data().setOptions({
          mode: 'des',
          order_by: this.column
        });
        this.hide();
        return false;
      },

      renameColumn: function(e) {
        e.preventDefault();
        this.hide();
        this.trigger('renameColumn');
        return false;
      },

      changeType: function(e) { 
        e.preventDefault();
        this.hide();
        this.trigger('changeType');
        return false;
      },

      georeference: function(e) { },

      filterColumn: function(e) { },

      deleteColumn: function(e) {
        e.preventDefault();
        cdb.log.debug("removing column: " + this.column);
        this.hide();
        this.table.deleteColumn(this.column);
        return false;
      }
    });

    /**
     * view used to render each row
     */
    cdb.admin.RowView = cdb.ui.common.RowView.extend({

      initialize: function() {
         this.constructor.__super__.initialize.apply(this);
         this.options.row_header = true;
      },
      /**
       * return each cell view
       */
      valueView: function(colName, value) {
        return $('<div>').append(value);
      }
    });


    /**
     * header cell view, manages operations on table columns
     */

    var HeaderView = cdb.admin.HeaderView = cdb.core.View.extend({

      events: {
        'click    .coloptions':      'showColumnOptions',
        'keydown  .col_name_edit':   '_checkEditColnameInput'
      },

      initialize: function() {
        this.column = this.options.column;
        this.table = this.options.table;
        this.template = this.getTemplate('table/views/table_header_view');
        this.editing_name = false;
        this.changing_type = false;

        HeaderView.colOptions= new HeaderDropdown({
          position: 'position',
          template_base: "table/views/table_header_options"
        });
        HeaderView.colOptions.render();
        cdb.god.bind("closeDialogs", HeaderView.colOptions.hide, HeaderView.colOptions);
      },

      render: function() {
        this.$el.html('');

        this.$el.append(this.template({
          col_name: this.column[0],
          col_type: this.column[1],
          editing_name: this.editing_name,
          changing_type: this.changing_type
        }));
        return this;
      },

      _openColOptions: function(e) {
        var colOptions = HeaderView.colOptions;
        colOptions.off();

        // set data for column and table currently editing
        colOptions.setTable(this.table, this.column[0]);

        colOptions.bind('renameColumn', this._renameColumn, this);
        colOptions.bind('changeType', this._changeType, this);

        // bind the stuff
        var container = $(e.target).parent().parent();
        container.append(colOptions.el);

        colOptions.openAt(0, 0);
      },

      _checkEditColnameInput: function(e) {
        if(e.keyCode === 13) {
          this.table.renameColumn(this.column[0], $('.col_name_edit').val());
          this.editing_name = false;
          this.render();
        }
      },

      _finishEdit: function() {
        this.editing_name = false;
        this.render();
      },

      _renameColumn: function() {
        this.editing_name = true;
        this.changing_type = false;
        this.render();
      },

      _changeType: function() {
        this.editing_name = false;
        this.changing_type = true;
        this.render();
      },

      showColumnOptions: function(e) {
        var self = this;
        e.preventDefault();
        var colOptions = HeaderView.colOptions;
        colOptions.hide(function() {
          self._openColOptions(e);
        });
        return false;
      }

    });

    /**
     * table view shown in admin
     */
    cdb.admin.TableView = cdb.ui.common.Table.extend({

      rowView: cdb.admin.RowView,

      initialize: function() {
         var self = this;
         this.constructor.__super__.initialize.apply(this);
         this.options.row_header = true;
         this.model.data().bind('newPage', this.newPage, this);
         var topReached = false;
         this._editorsOpened = null;
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
           if(tableHeight < pageSize) return;
           if(realPos > tableHeight) {
              console.log(realPos, tableHeight, tableHeight - realPos);
              d.setPage(d.getPage() + 1);
           } else if (pos <= 0) {
             if(!topReached) {
               d.setPage(d.getPage() - 1);
             }
             topReached = true;
           }

         }, 2000);


        // Moving header when scrolls
        $(window).scroll(function(ev){
          self.$el.find("thead > tr > th > div").css({marginLeft: -$(window).scrollLeft() + "px"});
        });


        this.model.data().bind('loadingRows', function(updown) {
          var fn = updown === 'up'? 'prepend': 'append';
          self.$('tbody')[fn]("<div style='padding: 50px 0;' class='dataloader'>LOADING</div>");
        });

        this.model.data().bind('endLoadingRows', function() {
          self.$('.dataloader').remove();
        });

        this.bind('cellClick', this._editCell, this);

      },

      _getEditor: function(columnType, opts) {

        var editors = {
          'string': cdb.admin.EditTextDialog,
          'number': cdb.admin.EditTextDialog,
          'geometry': cdb.admin.EditGeometryDialog
        };

        // clean previous if exits
        var view = this._editorsOpened;
        if(view) {
          view.clean();
        }
        var Editor = editors[columnType];
        return this._editorsOpened = new Editor(opts);
      },

      _editCell: function(e, cell, x, y) {
        var self = this;
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

        // auto add to body
        var offset = $(e.target).offset();
        offset.top -= $(window).scrollTop();
        offset.left -= $(window).scrollLeft();
        dlg.showAt(offset.left, offset.top);

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
