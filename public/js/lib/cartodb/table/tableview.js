
(function() {

    var HeaderDropdown = cdb.admin.UserMenu.extend({ 

      events: {
        'click .order_column': 'orderColumns',
        'click .rename_column': 'renameColumn',
        'click .change_data_type': 'changeType',
        'click .georeference': 'georeference',
        'click .filter_by_this_column': 'filterColumn',
        'click .delete_column': 'deleteColumn'
      },

      setTable: function(table, column) {
        this.table = table;
        this.column = column;
      },

      orderColumns: function(e) { },

      renameColumn: function(e) {
        e.preventdefault();
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
        this.$el.append(colOptions.el);

        // set data for column and table currently editing
        colOptions.setTable(this.table, this.column[0]);

        colOptions.bind('renameColumn', this._renameColumn, this);
        colOptions.bind('changeType', this._changeType, this);

        // bind the stuff
        colOptions.open(e, e.target);
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
        this.changing_type = falsee;
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
          self.$el.find("thead th div div").css({top: $(window).scrollTop() + "px"});
        });

        this.model.data().bind('loadingRows', function(updown) {
          var fn = updown === 'up'? 'prepend': 'append';
          self.$('tbody')[fn]("<div style='padding: 50px 0;' class='dataloader'>LOADING</div>");
        });

        this.model.data().bind('endLoadingRows', function() {
          self.$('.loader').remove();
        });

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
