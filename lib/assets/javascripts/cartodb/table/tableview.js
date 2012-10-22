
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
        this.model.data().bind('newPage', this.newPage, this);
        _.bindAll(this, "render", "addEmptyRow", "_checkEmptyTable", "_forceScroll", "rowChanged", "rowSynched", "rowFailed", "rowDestroyed", "emptyTable");
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
             d.setPage(d.getPage() + 1);
          } else if (pos <= 0) {
            if(!topReached) {
              d.setPage(d.getPage() - 1);
            }
            topReached = true;
          }

        }, 2000);


        // Moving header and loaders when scrolls
        this.scroll_position = { x:$(window).scrollLeft(), y:$(window).scrollTop(), last: 'vertical' };
        
        $(window).scroll(function(ev){
          // console.log(ev);
          var actual_scroll_position = { x:$(window).scrollLeft(), y:$(window).scrollTop() };

          if (self.scroll_position.x != actual_scroll_position.x) {
            self.scroll_position.x = actual_scroll_position.x;
            self.$el.find("thead").addClass("horizontal");

            // If last change was vertical
            if (self.scroll_position.last == "vertical") {
              self.scroll_position.x = actual_scroll_position.x;
              self.$el.find("thead div > div").css("top", actual_scroll_position.y + "px");
              self.scroll_position.last = "horizontal";
            }
            
          } else if (self.scroll_position.y != actual_scroll_position.y) {
            self.scroll_position.y = actual_scroll_position.y;
            self.$el.find("thead").removeClass("horizontal");

            // If last change was vertical
            if (self.scroll_position.last == "horizontal") {
              self.$el.find("thead > tr > th > div")
                .css({"marginLeft": "-" + actual_scroll_position.x + "px"})
              self.$el.find("thead > tr > th > div > div").removeAttr('style')
              self.scroll_position.last = "vertical";
            }
          }

          // move header
          // var actual = new Date().getTime();
          // if ((actual - self.timestamp) >= 250) {
          //   self.$el.find("thead > tr > th > div").css({marginLeft: -$(window).scrollLeft() + "px"});  
          // }
        });


        this.model.data().bind('loadingRows', function(updown) {
          var fn = updown === 'up'? 'prepend': 'append';
          self.$el[fn]("<tfoot class='page_loader " + updown + "'><tr><th colspan='1'><div class='fake'></div><div class='float_info'><h5>Loading more rows</h5><p>Now viewing 120 of 264</p></div></th></tr></tfoot>");
        });

        this.model.data().bind('endLoadingRows', function() {
          //self.$el.find('.page_loader').remove();
        });

        this.bind('cellDblClick', this._editCell, this);
        this.model.bind('change:dataSource', this._onSQLView, this);
        // when model changes the header is re rendered so the notice should be added
        this.model.bind('change', this._onSQLView, this);
        this.model.bind('dataLoaded', function() {
          self._checkEmptyTable();
          self._forceScroll();
        });

        this.bind('createRow', function() {
          self._checkEmptyTable();
        });

        // this.model.bind('loadModelStarted', function() {
        //   self.$el.fadeOut()
        // })

        // this.model.bind('loadModelCompleted', function() {
        //   self.$el.fadeIn()
        // })

        // this.model.bind('loadModelFailed', function() {
        //   self.$el.fadeIn()
        // })

      },

      render: function(args) {
        this.elder('render', args);
        this.trigger('render');
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
      * Captures the change event from the row and produces a notification
      * @method rowChanged
      * @todo (xabel) i'm pretty sure there has to be a less convulted way of doing this, without capturing a event
      * to throw another event in the model to be captured by some view
      */
      rowChanged: function() {
        this.model.notice('<span class="iconClock"></span>Saving your edit.');
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

    // cdb.admin.PublicTableTab = cdb.admin.TableTab

})();
