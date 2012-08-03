
(function() {

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
           if(tableHeight < pageSize) {
             return;
           }
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
        this._editorsOpened = new Editor(opts);
        return this._editorsOpened;
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
